/**
 * API覆盖率报告生成器
 * 
 * 功能：
 * 1. 扫描所有后端API接口定义
 * 2. 检查每个API是否有对应的前端调用
 * 3. 验证UI组件是否覆盖所有功能
 * 4. 生成详细的覆盖率报告
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

class APICoverageReporter {
  constructor() {
    this.apiDefinitions = {};
    this.frontendCalls = new Set();
    this.uiComponents = new Set();
    this.coverageReport = {
      totalApis: 0,
      coveredApis: 0,
      uncoveredApis: [],
      uiGaps: [],
      recommendations: []
    };
  }

  /**
   * 加载API接口定义
   */
  async loadApiDefinitions() {
    try {
      // 加载后端API接口定义
      const apiInterfacePath = path.join(process.cwd(), '.artifacts', 'api_interface.yml');
      if (fs.existsSync(apiInterfacePath)) {
        const apiContent = fs.readFileSync(apiInterfacePath, 'utf8');
        const apiData = yaml.load(apiContent);
        this.apiDefinitions = apiData;
      }

      // 加载UI接口定义
      const uiInterfacePath = path.join(process.cwd(), '.artifacts', 'ui_interface.yml');
      if (fs.existsSync(uiInterfacePath)) {
        const uiContent = fs.readFileSync(uiInterfacePath, 'utf8');
        const uiData = yaml.load(uiContent);
        this.uiDefinitions = uiData;
      }

      console.log('✅ API定义加载完成');
    } catch (error) {
      console.error('❌ 加载API定义失败:', error.message);
    }
  }

  /**
   * 扫描前端代码中的API调用
   */
  async scanFrontendApiCalls() {
    const frontendDir = path.join(process.cwd(), 'frontend', 'src');
    
    if (!fs.existsSync(frontendDir)) {
      console.warn('⚠️ 前端目录不存在');
      return;
    }

    await this.scanDirectory(frontendDir);
    console.log(`✅ 扫描到 ${this.frontendCalls.size} 个前端API调用`);
  }

  /**
   * 递归扫描目录
   */
  async scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await this.scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
        await this.scanFile(filePath);
      }
    }
  }

  /**
   * 扫描单个文件
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 扫描API调用模式
      const apiCallPatterns = [
        /\/api\/[a-zA-Z0-9\-\/]+/g,           // /api/xxx 路径
        /axios\.(get|post|put|delete)\(/g,     // axios调用
        /fetch\(['"`]([^'"`]+)['"`]/g,         // fetch调用
        /\.then\(/g,                           // Promise调用
        /await\s+\w+Api\./g,                   // API服务调用
      ];

      apiCallPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            this.frontendCalls.add(match);
          });
        }
      });

      // 扫描UI组件和测试ID
      const uiPatterns = [
        /data-testid=['"`]([^'"`]+)['"`]/g,    // 测试ID
        /className=['"`]([^'"`]+)['"`]/g,      // CSS类名
        /onClick={([^}]+)}/g,                  // 点击事件
        /onSubmit={([^}]+)}/g,                 // 表单提交
        /useState\(/g,                         // 状态管理
        /useEffect\(/g,                        // 副作用
      ];

      uiPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            this.uiComponents.add(match);
          });
        }
      });

    } catch (error) {
      console.error(`❌ 扫描文件失败 ${filePath}:`, error.message);
    }
  }

  /**
   * 分析API覆盖率
   */
  analyzeApiCoverage() {
    if (!this.apiDefinitions.paths) {
      console.warn('⚠️ 未找到API路径定义');
      return;
    }

    const apiPaths = Object.keys(this.apiDefinitions.paths);
    this.coverageReport.totalApis = apiPaths.length;

    apiPaths.forEach(apiPath => {
      const methods = Object.keys(this.apiDefinitions.paths[apiPath]);
      
      methods.forEach(method => {
        const apiKey = `${method.toUpperCase()} ${apiPath}`;
        const isCovered = this.isApiCovered(apiPath, method);
        
        if (isCovered) {
          this.coverageReport.coveredApis++;
        } else {
          this.coverageReport.uncoveredApis.push({
            path: apiPath,
            method: method.toUpperCase(),
            description: this.apiDefinitions.paths[apiPath][method].summary || '无描述'
          });
        }
      });
    });

    console.log(`✅ API覆盖率分析完成: ${this.coverageReport.coveredApis}/${this.coverageReport.totalApis}`);
  }

  /**
   * 检查API是否被前端覆盖
   */
  isApiCovered(apiPath, method) {
    // 检查是否有对应的前端调用
    const pathVariations = [
      apiPath,
      apiPath.replace(/\{[^}]+\}/g, ''), // 移除路径参数
      apiPath.replace(/\{[^}]+\}/g, '*'), // 替换为通配符
    ];

    return pathVariations.some(path => {
      return Array.from(this.frontendCalls).some(call => {
        return call.includes(path) || call.includes(path.replace('/api', ''));
      });
    });
  }

  /**
   * 分析UI完整性
   */
  analyzeUICompleteness() {
    // 检查关键UI组件是否存在
    const requiredUIComponents = [
      // 用户认证相关
      'login-button', 'register-button', 'logout-button',
      'phone-input', 'password-input', 'verification-code-input',
      
      // 车票查询相关
      'search-button', 'departure-city-input', 'arrival-city-input',
      'departure-date-input', 'train-list', 'book-button',
      
      // 订单管理相关
      'order-list', 'order-detail', 'cancel-order-button',
      'change-ticket-button', 'refund-button',
      
      // 乘车人管理相关
      'passenger-list', 'add-passenger-button', 'passenger-name-input',
      'passenger-idcard-input', 'save-passenger-button',
      
      // 支付相关
      'payment-method', 'pay-button', 'payment-status',
      
      // 用户中心相关
      'user-avatar', 'edit-profile-button', 'change-password-button'
    ];

    const missingComponents = requiredUIComponents.filter(component => {
      return !Array.from(this.uiComponents).some(ui => 
        ui.includes(component) || ui.includes(component.replace('-', '_'))
      );
    });

    this.coverageReport.uiGaps = missingComponents.map(component => ({
      component,
      severity: this.getComponentSeverity(component),
      recommendation: this.getComponentRecommendation(component)
    }));

    console.log(`✅ UI完整性分析完成，发现 ${missingComponents.length} 个缺失组件`);
  }

  /**
   * 获取组件缺失的严重程度
   */
  getComponentSeverity(component) {
    const criticalComponents = [
      'login-button', 'register-button', 'search-button', 'book-button', 'pay-button'
    ];
    
    const importantComponents = [
      'order-list', 'passenger-list', 'user-avatar', 'logout-button'
    ];

    if (criticalComponents.includes(component)) {
      return 'critical';
    } else if (importantComponents.includes(component)) {
      return 'important';
    } else {
      return 'minor';
    }
  }

  /**
   * 获取组件修复建议
   */
  getComponentRecommendation(component) {
    const recommendations = {
      'login-button': '在登录页面添加登录按钮，绑定登录API',
      'register-button': '在注册页面添加注册按钮，绑定注册API',
      'search-button': '在搜索页面添加搜索按钮，绑定车票查询API',
      'book-button': '在车次列表中添加预订按钮，绑定订单创建API',
      'pay-button': '在支付页面添加支付按钮，绑定支付API',
      'order-list': '创建订单列表组件，展示用户订单',
      'passenger-list': '创建乘车人列表组件，管理乘车人信息',
      'user-avatar': '在导航栏添加用户头像，提供用户菜单'
    };

    return recommendations[component] || `添加 ${component} 组件以完善用户界面`;
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = [];

    // API覆盖率建议
    if (this.coverageReport.uncoveredApis.length > 0) {
      recommendations.push({
        category: 'API覆盖率',
        priority: 'high',
        description: `有 ${this.coverageReport.uncoveredApis.length} 个API接口缺少前端调用`,
        actions: this.coverageReport.uncoveredApis.map(api => 
          `为 ${api.method} ${api.path} 添加前端调用和UI界面`
        )
      });
    }

    // UI完整性建议
    const criticalUIGaps = this.coverageReport.uiGaps.filter(gap => gap.severity === 'critical');
    if (criticalUIGaps.length > 0) {
      recommendations.push({
        category: 'UI完整性',
        priority: 'critical',
        description: `缺少 ${criticalUIGaps.length} 个关键UI组件`,
        actions: criticalUIGaps.map(gap => gap.recommendation)
      });
    }

    // 测试覆盖率建议
    recommendations.push({
      category: '测试覆盖率',
      priority: 'medium',
      description: '确保所有UI组件都有对应的测试用例',
      actions: [
        '为每个页面组件编写单元测试',
        '为关键用户流程编写集成测试',
        '为完整业务流程编写端到端测试'
      ]
    });

    this.coverageReport.recommendations = recommendations;
  }

  /**
   * 生成详细报告
   */
  generateDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalApis: this.coverageReport.totalApis,
        coveredApis: this.coverageReport.coveredApis,
        coveragePercentage: Math.round((this.coverageReport.coveredApis / this.coverageReport.totalApis) * 100),
        uiGapsCount: this.coverageReport.uiGaps.length,
        recommendationsCount: this.coverageReport.recommendations.length
      },
      details: {
        uncoveredApis: this.coverageReport.uncoveredApis,
        uiGaps: this.coverageReport.uiGaps,
        recommendations: this.coverageReport.recommendations
      },
      frontendCalls: Array.from(this.frontendCalls),
      uiComponents: Array.from(this.uiComponents)
    };

    return report;
  }

  /**
   * 保存报告到文件
   */
  async saveReport(report) {
    const reportDir = path.join(process.cwd(), 'test', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `api-coverage-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(reportDir, `api-coverage-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlReport);

    console.log(`✅ 报告已保存到: ${reportPath}`);
    console.log(`✅ HTML报告已保存到: ${htmlPath}`);
  }

  /**
   * 生成HTML报告
   */
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>12306 Demo API覆盖率报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #1890ff; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .card h3 { margin: 0 0 10px 0; }
        .card .number { font-size: 2em; font-weight: bold; color: #1890ff; }
        .section { margin: 30px 0; }
        .section h2 { border-bottom: 2px solid #1890ff; padding-bottom: 10px; }
        .api-item, .ui-item { background: white; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .severity-critical { border-left: 5px solid #ff4d4f; }
        .severity-important { border-left: 5px solid #faad14; }
        .severity-minor { border-left: 5px solid #52c41a; }
        .recommendation { background: #e6f7ff; border: 1px solid #91d5ff; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .progress-bar { background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-fill { background: #52c41a; height: 100%; transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="header">
        <h1>12306 Demo API覆盖率报告</h1>
        <p>生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
    </div>

    <div class="summary">
        <div class="card">
            <h3>API总数</h3>
            <div class="number">${report.summary.totalApis}</div>
        </div>
        <div class="card">
            <h3>已覆盖API</h3>
            <div class="number">${report.summary.coveredApis}</div>
        </div>
        <div class="card">
            <h3>覆盖率</h3>
            <div class="number">${report.summary.coveragePercentage}%</div>
        </div>
        <div class="card">
            <h3>UI缺失</h3>
            <div class="number">${report.summary.uiGapsCount}</div>
        </div>
    </div>

    <div class="section">
        <h2>覆盖率进度</h2>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${report.summary.coveragePercentage}%"></div>
        </div>
        <p>${report.summary.coveragePercentage}% 的API已有前端实现</p>
    </div>

    <div class="section">
        <h2>未覆盖的API (${report.details.uncoveredApis.length})</h2>
        ${report.details.uncoveredApis.map(api => `
            <div class="api-item">
                <h4>${api.method} ${api.path}</h4>
                <p>${api.description}</p>
                <p><strong>建议:</strong> 为此API创建对应的前端调用和UI界面</p>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>UI组件缺失 (${report.details.uiGaps.length})</h2>
        ${report.details.uiGaps.map(gap => `
            <div class="ui-item severity-${gap.severity}">
                <h4>${gap.component}</h4>
                <p><strong>严重程度:</strong> ${gap.severity}</p>
                <p><strong>建议:</strong> ${gap.recommendation}</p>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>改进建议</h2>
        ${report.details.recommendations.map(rec => `
            <div class="recommendation">
                <h4>${rec.category} (优先级: ${rec.priority})</h4>
                <p>${rec.description}</p>
                <ul>
                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>检测到的前端API调用 (${report.frontendCalls.length})</h2>
        <ul>
            ${report.frontendCalls.slice(0, 20).map(call => `<li><code>${call}</code></li>`).join('')}
            ${report.frontendCalls.length > 20 ? '<li>... 更多调用请查看JSON报告</li>' : ''}
        </ul>
    </div>
</body>
</html>
    `;
  }

  /**
   * 运行完整的覆盖率分析
   */
  async run() {
    console.log('🚀 开始API覆盖率分析...');
    
    await this.loadApiDefinitions();
    await this.scanFrontendApiCalls();
    this.analyzeApiCoverage();
    this.analyzeUICompleteness();
    this.generateRecommendations();
    
    const report = this.generateDetailedReport();
    await this.saveReport(report);
    
    console.log('\n📊 分析结果摘要:');
    console.log(`API覆盖率: ${report.summary.coveragePercentage}% (${report.summary.coveredApis}/${report.summary.totalApis})`);
    console.log(`UI缺失组件: ${report.summary.uiGapsCount} 个`);
    console.log(`改进建议: ${report.summary.recommendationsCount} 条`);
    
    return report;
  }
}

// 导出类和运行函数
export default APICoverageReporter;

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  const reporter = new APICoverageReporter();
  reporter.run().catch(console.error);
}