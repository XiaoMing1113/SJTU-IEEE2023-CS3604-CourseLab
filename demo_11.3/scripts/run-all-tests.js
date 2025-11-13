/**
 * 12306 Demo 全量测试运行脚本
 * 
 * 功能：
 * 1. 按顺序运行所有类型的测试
 * 2. 生成综合测试报告
 * 3. 收集覆盖率数据
 * 4. 提供测试结果分析
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class TestRunner {
  constructor() {
    this.testSuites = [
      {
        name: '后端单元测试',
        command: 'npm test',
        cwd: path.join(projectRoot, 'backend'),
        type: 'unit',
        required: true,
      },
      {
        name: '前端单元测试',
        command: 'npm test',
        cwd: path.join(projectRoot, 'frontend'),
        type: 'unit',
        required: true,
      },
      {
        name: '后端集成测试',
        command: 'npm run test:integration',
        cwd: path.join(projectRoot, 'backend'),
        type: 'integration',
        required: true,
      },
      {
        name: '前端集成测试',
        command: 'npm run test:integration',
        cwd: path.join(projectRoot, 'frontend'),
        type: 'integration',
        required: true,
      },
      {
        name: '端到端测试',
        command: 'npx playwright test',
        cwd: projectRoot,
        type: 'e2e',
        required: false,
      },
      {
        name: 'UI完整性测试',
        command: 'npm run test:ui-completeness',
        cwd: projectRoot,
        type: 'ui',
        required: false,
      },
    ];

    this.results = {
      suites: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        coverage: {},
      },
      startTime: new Date(),
      endTime: null,
      duration: 0,
    };

    this.options = {
      bail: false,           // 是否在第一个失败时停止
      coverage: true,        // 是否收集覆盖率
      parallel: false,       // 是否并行运行（暂不支持）
      verbose: true,         // 详细输出
      generateReport: true,  // 生成HTML报告
    };
  }

  /**
   * 运行所有测试套件
   */
  async runAllTests(options = {}) {
    this.options = { ...this.options, ...options };
    
    console.log('🚀 开始运行12306 Demo全量测试...\n');
    console.log(`📋 计划运行 ${this.testSuites.length} 个测试套件`);
    console.log(`⚙️  配置: ${JSON.stringify(this.options, null, 2)}\n`);

    // 预检查
    await this.preCheck();

    // 运行测试套件
    for (const suite of this.testSuites) {
      const result = await this.runTestSuite(suite);
      this.results.suites.push(result);

      // 如果是必需的测试失败且设置了bail，则停止
      if (result.status === 'failed' && suite.required && this.options.bail) {
        console.log(`💥 必需测试 "${suite.name}" 失败，停止后续测试`);
        break;
      }
    }

    // 后处理
    await this.postProcess();

    // 生成报告
    if (this.options.generateReport) {
      await this.generateReport();
    }

    this.printSummary();
    return this.results;
  }

  /**
   * 预检查
   */
  async preCheck() {
    console.log('🔍 运行预检查...');

    // 检查项目结构
    const requiredDirs = ['backend', 'frontend', 'test'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        throw new Error(`缺少必要目录: ${dir}`);
      }
    }

    // 检查测试环境
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'test';
    }

    // 检查数据库
    const testDbPath = path.join(projectRoot, 'backend', 'test.db');
    if (!fs.existsSync(testDbPath)) {
      console.log('⚠️  测试数据库不存在，尝试初始化...');
      try {
        execSync('node scripts/setup-test-env.js', { 
          cwd: projectRoot,
          stdio: 'inherit'
        });
      } catch (error) {
        console.warn('⚠️  测试环境初始化失败，某些测试可能会失败');
      }
    }

    console.log('✅ 预检查完成\n');
  }

  /**
   * 运行单个测试套件
   */
  async runTestSuite(suite) {
    console.log(`🧪 运行测试套件: ${suite.name}`);
    console.log(`   命令: ${suite.command}`);
    console.log(`   目录: ${suite.cwd}`);

    const result = {
      name: suite.name,
      type: suite.type,
      command: suite.command,
      cwd: suite.cwd,
      status: 'pending',
      startTime: new Date(),
      endTime: null,
      duration: 0,
      output: '',
      error: null,
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      },
      coverage: null,
    };

    try {
      // 检查工作目录是否存在
      if (!fs.existsSync(suite.cwd)) {
        throw new Error(`工作目录不存在: ${suite.cwd}`);
      }

      // 检查package.json是否存在
      const packageJsonPath = path.join(suite.cwd, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json不存在: ${packageJsonPath}`);
      }

      // 运行测试命令
      const output = execSync(suite.command, {
        cwd: suite.cwd,
        encoding: 'utf8',
        env: { ...process.env, NODE_ENV: 'test' },
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      result.output = output;
      result.status = 'passed';
      
      // 解析测试结果
      this.parseTestOutput(result, output);

      console.log(`✅ ${suite.name} 完成`);
      if (this.options.verbose) {
        console.log(`   通过: ${result.stats.passed}, 失败: ${result.stats.failed}, 跳过: ${result.stats.skipped}`);
      }

    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.output = error.stdout || error.message;

      console.log(`❌ ${suite.name} 失败`);
      if (this.options.verbose) {
        console.log(`   错误: ${error.message}`);
      }

      // 尝试解析失败的输出
      this.parseTestOutput(result, error.stdout || '');
    }

    result.endTime = new Date();
    result.duration = result.endTime - result.startTime;

    console.log(`   耗时: ${result.duration}ms\n`);
    return result;
  }

  /**
   * 解析测试输出
   */
  parseTestOutput(result, output) {
    // Jest输出解析
    const jestMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (jestMatch) {
      result.stats.failed = parseInt(jestMatch[1]);
      result.stats.passed = parseInt(jestMatch[2]);
      result.stats.total = parseInt(jestMatch[3]);
      return;
    }

    // Vitest输出解析
    const vitestMatch = output.match(/Test Files\s+(\d+)\s+passed.*\s+(\d+)\s+total/);
    if (vitestMatch) {
      result.stats.passed = parseInt(vitestMatch[1]);
      result.stats.total = parseInt(vitestMatch[2]);
      result.stats.failed = result.stats.total - result.stats.passed;
      return;
    }

    // Playwright输出解析
    const playwrightMatch = output.match(/(\d+)\s+passed.*(\d+)\s+failed.*(\d+)\s+skipped/);
    if (playwrightMatch) {
      result.stats.passed = parseInt(playwrightMatch[1]);
      result.stats.failed = parseInt(playwrightMatch[2]);
      result.stats.skipped = parseInt(playwrightMatch[3]);
      result.stats.total = result.stats.passed + result.stats.failed + result.stats.skipped;
      return;
    }

    // 通用解析（基于关键词）
    const passedMatch = output.match(/(\d+)\s+(?:passed|通过)/i);
    const failedMatch = output.match(/(\d+)\s+(?:failed|失败)/i);
    const skippedMatch = output.match(/(\d+)\s+(?:skipped|跳过)/i);

    if (passedMatch) result.stats.passed = parseInt(passedMatch[1]);
    if (failedMatch) result.stats.failed = parseInt(failedMatch[1]);
    if (skippedMatch) result.stats.skipped = parseInt(skippedMatch[1]);
    
    result.stats.total = result.stats.passed + result.stats.failed + result.stats.skipped;
  }

  /**
   * 后处理
   */
  async postProcess() {
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;

    // 计算总体统计
    this.results.suites.forEach(suite => {
      this.results.summary.total += suite.stats.total;
      this.results.summary.passed += suite.stats.passed;
      this.results.summary.failed += suite.stats.failed;
      this.results.summary.skipped += suite.stats.skipped;
    });

    // 收集覆盖率数据
    if (this.options.coverage) {
      await this.collectCoverage();
    }
  }

  /**
   * 收集覆盖率数据
   */
  async collectCoverage() {
    console.log('📊 收集覆盖率数据...');

    const coverageFiles = [
      path.join(projectRoot, 'backend', 'coverage', 'coverage-summary.json'),
      path.join(projectRoot, 'frontend', 'coverage', 'coverage-summary.json'),
    ];

    for (const coverageFile of coverageFiles) {
      if (fs.existsSync(coverageFile)) {
        try {
          const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
          const projectName = coverageFile.includes('backend') ? 'backend' : 'frontend';
          this.results.summary.coverage[projectName] = coverageData.total;
        } catch (error) {
          console.warn(`⚠️  读取覆盖率文件失败: ${coverageFile}`);
        }
      }
    }

    console.log('✅ 覆盖率数据收集完成');
  }

  /**
   * 生成测试报告
   */
  async generateReport() {
    console.log('📋 生成测试报告...');

    const reportDir = path.join(projectRoot, 'test', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // 生成JSON报告
    const jsonReportPath = path.join(reportDir, `test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHTMLReport();
    const htmlReportPath = path.join(reportDir, `test-report-${Date.now()}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`✅ 测试报告已生成:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  /**
   * 生成HTML报告
   */
  generateHTMLReport() {
    const passRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.passed / this.results.summary.total) * 100)
      : 0;

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>12306 Demo 测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .summary-card.passed { border-left-color: #28a745; }
        .summary-card.failed { border-left-color: #dc3545; }
        .summary-card.skipped { border-left-color: #ffc107; }
        .summary-card h3 { margin: 0 0 10px 0; color: #495057; }
        .summary-card .number { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .summary-card.passed .number { color: #28a745; }
        .summary-card.failed .number { color: #dc3545; }
        .summary-card.skipped .number { color: #ffc107; }
        .progress-bar { background: #e9ecef; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
        .progress-fill { background: linear-gradient(90deg, #28a745, #20c997); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: width 0.5s ease; }
        .test-suites { margin: 30px 0; }
        .test-suite { background: white; border: 1px solid #dee2e6; border-radius: 8px; margin: 15px 0; overflow: hidden; }
        .test-suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
        .test-suite-header h4 { margin: 0; color: #495057; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .test-suite-body { padding: 15px; }
        .test-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; margin: 15px 0; }
        .test-stat { text-align: center; }
        .test-stat .label { font-size: 0.9em; color: #6c757d; }
        .test-stat .value { font-size: 1.5em; font-weight: bold; }
        .coverage-section { margin: 30px 0; }
        .coverage-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .coverage-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .coverage-fill { height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8em; font-weight: bold; }
        .footer { text-align: center; margin: 30px 0; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>12306 Demo 测试报告</h1>
            <p>生成时间: ${this.results.endTime.toLocaleString('zh-CN')}</p>
            <p>总耗时: ${Math.round(this.results.duration / 1000)}秒</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>总测试数</h3>
                <div class="number">${this.results.summary.total}</div>
            </div>
            <div class="summary-card passed">
                <h3>通过</h3>
                <div class="number">${this.results.summary.passed}</div>
            </div>
            <div class="summary-card failed">
                <h3>失败</h3>
                <div class="number">${this.results.summary.failed}</div>
            </div>
            <div class="summary-card skipped">
                <h3>跳过</h3>
                <div class="number">${this.results.summary.skipped}</div>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${passRate}%">
                通过率: ${passRate}%
            </div>
        </div>

        <div class="test-suites">
            <h2>测试套件详情</h2>
            ${this.results.suites.map(suite => `
                <div class="test-suite">
                    <div class="test-suite-header">
                        <h4>${suite.name}</h4>
                        <span class="status-badge status-${suite.status}">${suite.status}</span>
                    </div>
                    <div class="test-suite-body">
                        <p><strong>类型:</strong> ${suite.type}</p>
                        <p><strong>命令:</strong> <code>${suite.command}</code></p>
                        <p><strong>耗时:</strong> ${Math.round(suite.duration / 1000)}秒</p>
                        
                        <div class="test-stats">
                            <div class="test-stat">
                                <div class="label">总计</div>
                                <div class="value">${suite.stats.total}</div>
                            </div>
                            <div class="test-stat">
                                <div class="label">通过</div>
                                <div class="value" style="color: #28a745;">${suite.stats.passed}</div>
                            </div>
                            <div class="test-stat">
                                <div class="label">失败</div>
                                <div class="value" style="color: #dc3545;">${suite.stats.failed}</div>
                            </div>
                            <div class="test-stat">
                                <div class="label">跳过</div>
                                <div class="value" style="color: #ffc107;">${suite.stats.skipped}</div>
                            </div>
                        </div>
                        
                        ${suite.error ? `<div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0;"><strong>错误:</strong> ${suite.error}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        ${Object.keys(this.results.summary.coverage).length > 0 ? `
        <div class="coverage-section">
            <h2>代码覆盖率</h2>
            ${Object.entries(this.results.summary.coverage).map(([project, coverage]) => `
                <div class="coverage-item">
                    <h4>${project}</h4>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${coverage.lines.pct}%; background: ${coverage.lines.pct >= 80 ? '#28a745' : coverage.lines.pct >= 60 ? '#ffc107' : '#dc3545'};">
                            行覆盖率: ${coverage.lines.pct}%
                        </div>
                    </div>
                    <p>函数覆盖率: ${coverage.functions.pct}% | 分支覆盖率: ${coverage.branches.pct}% | 语句覆盖率: ${coverage.statements.pct}%</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>12306 Demo 自动化测试系统 | 生成于 ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * 打印测试摘要
   */
  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 12306 Demo 测试结果摘要');
    console.log('='.repeat(80));
    
    console.log(`🕐 总耗时: ${Math.round(this.results.duration / 1000)}秒`);
    console.log(`📋 测试套件: ${this.results.suites.length}`);
    console.log(`🧪 总测试数: ${this.results.summary.total}`);
    console.log(`✅ 通过: ${this.results.summary.passed}`);
    console.log(`❌ 失败: ${this.results.summary.failed}`);
    console.log(`⏭️  跳过: ${this.results.summary.skipped}`);
    
    const passRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.passed / this.results.summary.total) * 100)
      : 0;
    console.log(`📈 通过率: ${passRate}%`);

    // 按类型统计
    console.log('\n📋 按类型统计:');
    const typeStats = {};
    this.results.suites.forEach(suite => {
      if (!typeStats[suite.type]) {
        typeStats[suite.type] = { total: 0, passed: 0, failed: 0 };
      }
      typeStats[suite.type].total += suite.stats.total;
      typeStats[suite.type].passed += suite.stats.passed;
      typeStats[suite.type].failed += suite.stats.failed;
    });

    Object.entries(typeStats).forEach(([type, stats]) => {
      const rate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      console.log(`   ${type}: ${stats.passed}/${stats.total} (${rate}%)`);
    });

    // 覆盖率摘要
    if (Object.keys(this.results.summary.coverage).length > 0) {
      console.log('\n📊 覆盖率摘要:');
      Object.entries(this.results.summary.coverage).forEach(([project, coverage]) => {
        console.log(`   ${project}: 行${coverage.lines.pct}% | 函数${coverage.functions.pct}% | 分支${coverage.branches.pct}%`);
      });
    }

    // 失败的测试套件
    const failedSuites = this.results.suites.filter(suite => suite.status === 'failed');
    if (failedSuites.length > 0) {
      console.log('\n❌ 失败的测试套件:');
      failedSuites.forEach(suite => {
        console.log(`   - ${suite.name}: ${suite.error || '未知错误'}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    
    if (this.results.summary.failed === 0) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log('💥 存在测试失败，请检查上述错误信息');
    }
  }
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    bail: args.includes('--bail'),
    coverage: !args.includes('--no-coverage'),
    verbose: !args.includes('--quiet'),
    generateReport: !args.includes('--no-report'),
  };

  return options;
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  const runner = new TestRunner();
  
  runner.runAllTests(options)
    .then((results) => {
      process.exit(results.summary.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 测试运行过程发生未预期错误:', error);
      process.exit(1);
    });
}

export default TestRunner;