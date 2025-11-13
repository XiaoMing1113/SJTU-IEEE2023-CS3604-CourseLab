/**
 * 12306 Demo 测试环境设置脚本
 * 
 * 功能：
 * 1. 检查并安装必要的依赖
 * 2. 设置测试数据库
 * 3. 运行数据库迁移
 * 4. 初始化种子数据
 * 5. 验证测试环境配置
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class TestEnvironmentSetup {
  constructor() {
    this.steps = [
      { name: '检查项目结构', fn: this.checkProjectStructure },
      { name: '检查依赖包', fn: this.checkDependencies },
      { name: '设置环境变量', fn: this.setupEnvironmentVariables },
      { name: '初始化数据库', fn: this.setupDatabase },
      { name: '运行数据库迁移', fn: this.runMigrations },
      { name: '初始化种子数据', fn: this.seedDatabase },
      { name: '验证测试环境', fn: this.validateTestEnvironment },
      { name: '生成测试报告', fn: this.generateTestReport },
    ];
    
    this.results = {
      success: [],
      warnings: [],
      errors: [],
      summary: {}
    };
  }

  /**
   * 运行所有设置步骤
   */
  async run() {
    console.log('🚀 开始设置12306 Demo测试环境...\n');
    
    for (const step of this.steps) {
      try {
        console.log(`📋 ${step.name}...`);
        await step.fn.call(this);
        this.results.success.push(step.name);
        console.log(`✅ ${step.name} 完成\n`);
      } catch (error) {
        console.error(`❌ ${step.name} 失败:`, error.message);
        this.results.errors.push({ step: step.name, error: error.message });
        
        // 某些步骤失败后可以继续，某些步骤失败后必须停止
        const criticalSteps = ['检查项目结构', '初始化数据库'];
        if (criticalSteps.includes(step.name)) {
          console.error('💥 关键步骤失败，停止设置过程');
          break;
        }
      }
    }

    this.printSummary();
    return this.results;
  }

  /**
   * 检查项目结构
   */
  async checkProjectStructure() {
    const requiredDirs = [
      'backend',
      'frontend',
      'backend/src',
      'backend/test',
      'backend/prisma',
      'frontend/src',
      'frontend/test',
      'test/e2e',
    ];

    const requiredFiles = [
      'backend/package.json',
      'frontend/package.json',
      'backend/prisma/schema.prisma',
      '.env.test',
    ];

    // 检查目录
    for (const dir of requiredDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.results.warnings.push(`创建缺失目录: ${dir}`);
      }
    }

    // 检查文件
    for (const file of requiredFiles) {
      const filePath = path.join(projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`缺少必要文件: ${file}`);
      }
    }

    console.log('  ✓ 项目结构检查完成');
  }

  /**
   * 检查依赖包
   */
  async checkDependencies() {
    const backendPackageJson = path.join(projectRoot, 'backend', 'package.json');
    const frontendPackageJson = path.join(projectRoot, 'frontend', 'package.json');

    // 检查后端依赖
    if (fs.existsSync(backendPackageJson)) {
      const backendNodeModules = path.join(projectRoot, 'backend', 'node_modules');
      if (!fs.existsSync(backendNodeModules)) {
        console.log('  📦 安装后端依赖...');
        execSync('npm install', { 
          cwd: path.join(projectRoot, 'backend'),
          stdio: 'inherit'
        });
      }
    }

    // 检查前端依赖
    if (fs.existsSync(frontendPackageJson)) {
      const frontendNodeModules = path.join(projectRoot, 'frontend', 'node_modules');
      if (!fs.existsSync(frontendNodeModules)) {
        console.log('  📦 安装前端依赖...');
        execSync('npm install', { 
          cwd: path.join(projectRoot, 'frontend'),
          stdio: 'inherit'
        });
      }
    }

    // 检查根目录依赖（如果有）
    const rootPackageJson = path.join(projectRoot, 'package.json');
    if (fs.existsSync(rootPackageJson)) {
      const rootNodeModules = path.join(projectRoot, 'node_modules');
      if (!fs.existsSync(rootNodeModules)) {
        console.log('  📦 安装根目录依赖...');
        execSync('npm install', { 
          cwd: projectRoot,
          stdio: 'inherit'
        });
      }
    }

    console.log('  ✓ 依赖包检查完成');
  }

  /**
   * 设置环境变量
   */
  async setupEnvironmentVariables() {
    const envTestPath = path.join(projectRoot, '.env.test');
    const envPath = path.join(projectRoot, '.env');

    // 如果没有 .env 文件，从 .env.test 复制
    if (!fs.existsSync(envPath) && fs.existsSync(envTestPath)) {
      fs.copyFileSync(envTestPath, envPath);
      this.results.warnings.push('从 .env.test 创建了 .env 文件');
    }

    // 设置测试环境变量
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'file:./test.db';

    console.log('  ✓ 环境变量设置完成');
  }

  /**
   * 初始化数据库
   */
  async setupDatabase() {
    const backendDir = path.join(projectRoot, 'backend');
    const testDbPath = path.join(backendDir, 'test.db');

    // 删除现有测试数据库
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('  🗑️ 删除现有测试数据库');
    }

    // 生成 Prisma 客户端
    try {
      execSync('npx prisma generate', { 
        cwd: backendDir,
        stdio: 'pipe'
      });
      console.log('  ✓ Prisma 客户端生成完成');
    } catch (error) {
      this.results.warnings.push('Prisma 客户端生成可能有问题');
    }

    console.log('  ✓ 数据库初始化完成');
  }

  /**
   * 运行数据库迁移
   */
  async runMigrations() {
    const backendDir = path.join(projectRoot, 'backend');

    try {
      // 推送数据库模式（适用于SQLite）
      execSync('npx prisma db push', { 
        cwd: backendDir,
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
      });
      console.log('  ✓ 数据库模式推送完成');
    } catch (error) {
      // 如果推送失败，尝试重置
      try {
        execSync('npx prisma db push --force-reset', { 
          cwd: backendDir,
          stdio: 'pipe',
          env: { ...process.env, DATABASE_URL: 'file:./test.db' }
        });
        console.log('  ✓ 数据库强制重置并推送完成');
      } catch (resetError) {
        throw new Error(`数据库迁移失败: ${resetError.message}`);
      }
    }
  }

  /**
   * 初始化种子数据
   */
  async seedDatabase() {
    const backendDir = path.join(projectRoot, 'backend');
    const seedFile = path.join(backendDir, 'prisma', 'seed.ts');

    if (!fs.existsSync(seedFile)) {
      this.results.warnings.push('种子文件不存在，跳过数据初始化');
      return;
    }

    try {
      // 运行种子脚本
      execSync('npx tsx prisma/seed.ts', { 
        cwd: backendDir,
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
      });
      console.log('  ✓ 种子数据初始化完成');
    } catch (error) {
      throw new Error(`种子数据初始化失败: ${error.message}`);
    }
  }

  /**
   * 验证测试环境
   */
  async validateTestEnvironment() {
    const validations = [
      this.validateDatabase,
      this.validateTestFiles,
      this.validateConfigFiles,
    ];

    for (const validation of validations) {
      await validation.call(this);
    }

    console.log('  ✓ 测试环境验证完成');
  }

  /**
   * 验证数据库
   */
  async validateDatabase() {
    const backendDir = path.join(projectRoot, 'backend');
    const testDbPath = path.join(backendDir, 'test.db');

    if (!fs.existsSync(testDbPath)) {
      throw new Error('测试数据库文件不存在');
    }

    // 检查数据库表
    try {
      const result = execSync('npx prisma db pull', { 
        cwd: backendDir,
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
      });
      console.log('    ✓ 数据库连接正常');
    } catch (error) {
      this.results.warnings.push('数据库连接验证失败');
    }
  }

  /**
   * 验证测试文件
   */
  async validateTestFiles() {
    const testFiles = [
      'backend/test/setup.ts',
      'frontend/test/setup.ts',
      'test/e2e/complete-booking.spec.js',
    ];

    let validTestFiles = 0;
    for (const testFile of testFiles) {
      const filePath = path.join(projectRoot, testFile);
      if (fs.existsSync(filePath)) {
        validTestFiles++;
      }
    }

    if (validTestFiles === 0) {
      throw new Error('没有找到任何测试文件');
    }

    console.log(`    ✓ 找到 ${validTestFiles} 个测试文件`);
  }

  /**
   * 验证配置文件
   */
  async validateConfigFiles() {
    const configFiles = [
      'backend/jest.config.js',
      'frontend/vite.config.ts',
      'playwright.config.ts',
    ];

    let validConfigFiles = 0;
    for (const configFile of configFiles) {
      const filePath = path.join(projectRoot, configFile);
      if (fs.existsSync(filePath)) {
        validConfigFiles++;
      }
    }

    console.log(`    ✓ 找到 ${validConfigFiles} 个配置文件`);
  }

  /**
   * 生成测试报告
   */
  async generateTestReport() {
    const reportDir = path.join(projectRoot, 'test', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      environment: 'test',
      setup: {
        success: this.results.success,
        warnings: this.results.warnings,
        errors: this.results.errors,
      },
      summary: {
        totalSteps: this.steps.length,
        successfulSteps: this.results.success.length,
        warningCount: this.results.warnings.length,
        errorCount: this.results.errors.length,
        setupComplete: this.results.errors.length === 0,
      },
      nextSteps: this.generateNextSteps(),
    };

    const reportPath = path.join(reportDir, `setup-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`  ✓ 测试报告已保存到: ${reportPath}`);
    this.results.summary = report.summary;
  }

  /**
   * 生成后续步骤建议
   */
  generateNextSteps() {
    const steps = [];

    if (this.results.errors.length === 0) {
      steps.push('✅ 测试环境设置完成，可以开始运行测试');
      steps.push('🧪 运行单元测试: npm run test');
      steps.push('🔗 运行集成测试: npm run test:integration');
      steps.push('🎭 运行端到端测试: npm run test:e2e');
      steps.push('📊 生成覆盖率报告: npm run test:coverage');
    } else {
      steps.push('❌ 测试环境设置未完成，请解决以下问题:');
      this.results.errors.forEach(error => {
        steps.push(`   - ${error.step}: ${error.error}`);
      });
    }

    if (this.results.warnings.length > 0) {
      steps.push('⚠️ 注意以下警告:');
      this.results.warnings.forEach(warning => {
        steps.push(`   - ${warning}`);
      });
    }

    return steps;
  }

  /**
   * 打印设置摘要
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 12306 Demo 测试环境设置摘要');
    console.log('='.repeat(60));
    
    console.log(`✅ 成功步骤: ${this.results.success.length}/${this.steps.length}`);
    console.log(`⚠️  警告数量: ${this.results.warnings.length}`);
    console.log(`❌ 错误数量: ${this.results.errors.length}`);
    
    if (this.results.errors.length === 0) {
      console.log('\n🎉 测试环境设置完成！');
      console.log('\n📝 后续步骤:');
      console.log('   1. 运行单元测试: npm run test');
      console.log('   2. 运行集成测试: npm run test:integration');
      console.log('   3. 运行端到端测试: npm run test:e2e');
      console.log('   4. 查看覆盖率报告: npm run test:coverage');
    } else {
      console.log('\n💥 测试环境设置未完成，请解决上述错误后重试');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new TestEnvironmentSetup();
  setup.run()
    .then((results) => {
      process.exit(results.errors.length === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 设置过程发生未预期错误:', error);
      process.exit(1);
    });
}

export default TestEnvironmentSetup;