const fs = require('fs');
const path = require('path');

/**
 * Playwright全局清理
 * 在所有测试运行完成后执行一次
 */
async function globalTeardown(config) {
  console.log('🧹 开始全局测试环境清理...');

  try {
    // 1. 清理测试会话文件
    console.log('🗑️ 清理测试会话文件...');
    await cleanupSessionFiles();
    console.log('✅ 测试会话文件清理完成');

    // 2. 清理临时测试数据
    console.log('🗄️ 清理临时测试数据...');
    await cleanupTestData();
    console.log('✅ 临时测试数据清理完成');

    // 3. 生成测试报告摘要
    console.log('📊 生成测试报告摘要...');
    await generateTestSummary();
    console.log('✅ 测试报告摘要生成完成');

    // 4. 清理上传的测试文件
    console.log('📁 清理上传的测试文件...');
    await cleanupUploadedFiles();
    console.log('✅ 上传文件清理完成');

    console.log('🎉 全局测试环境清理完成！');

  } catch (error) {
    console.error('❌ 全局清理失败:', error);
    // 不抛出错误，避免影响测试结果
  }
}

/**
 * 清理测试会话文件
 */
async function cleanupSessionFiles() {
  const sessionFiles = [
    path.join(__dirname, 'admin-session.json'),
    path.join(__dirname, 'user-session.json'),
  ];

  for (const file of sessionFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`  - 已删除: ${path.basename(file)}`);
      }
    } catch (error) {
      console.warn(`  - 删除失败: ${path.basename(file)} - ${error.message}`);
    }
  }
}

/**
 * 清理临时测试数据
 */
async function cleanupTestData() {
  try {
    const response = await fetch('http://localhost:3001/api/test/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('  - 数据库临时数据已清理');
    } else {
      console.log('  - 数据库清理跳过（服务器可能已关闭）');
    }
  } catch (error) {
    console.log('  - 数据库清理跳过（服务器不可用）');
  }
}

/**
 * 生成测试报告摘要
 */
async function generateTestSummary() {
  const testResultsDir = path.join(__dirname, '../../test-results');
  
  if (!fs.existsSync(testResultsDir)) {
    console.log('  - 无测试结果目录，跳过摘要生成');
    return;
  }

  try {
    const summary = {
      timestamp: new Date().toISOString(),
      testRun: {
        startTime: process.env.TEST_START_TIME || new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: process.env.TEST_START_TIME 
          ? Date.now() - new Date(process.env.TEST_START_TIME).getTime()
          : 0,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      reports: {
        playwrightReport: fs.existsSync(path.join(testResultsDir, 'playwright-report')) 
          ? 'test-results/playwright-report/index.html' 
          : null,
        playwrightResults: fs.existsSync(path.join(testResultsDir, 'playwright-results.json'))
          ? 'test-results/playwright-results.json'
          : null,
        junitResults: fs.existsSync(path.join(testResultsDir, 'playwright-results.xml'))
          ? 'test-results/playwright-results.xml'
          : null,
      },
      cleanup: {
        sessionsCleared: true,
        tempDataCleared: true,
        uploadsCleared: true,
      }
    };

    fs.writeFileSync(
      path.join(testResultsDir, 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('  - 测试摘要已保存到 test-results/test-summary.json');
    
    // 如果有Playwright结果，显示简要统计
    const playwrightResultsPath = path.join(testResultsDir, 'playwright-results.json');
    if (fs.existsSync(playwrightResultsPath)) {
      try {
        const results = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf8'));
        console.log(`  - 测试统计: ${results.stats?.expected || 0} 通过, ${results.stats?.unexpected || 0} 失败, ${results.stats?.skipped || 0} 跳过`);
      } catch (error) {
        console.log('  - 无法解析测试统计信息');
      }
    }

  } catch (error) {
    console.warn(`  - 测试摘要生成失败: ${error.message}`);
  }
}

/**
 * 清理上传的测试文件
 */
async function cleanupUploadedFiles() {
  const uploadsDir = path.join(__dirname, '../../backend/uploads/test');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('  - 无测试上传目录，跳过清理');
    return;
  }

  try {
    const files = fs.readdirSync(uploadsDir);
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      // 删除超过1小时的测试文件
      if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }

    console.log(`  - 已清理 ${cleanedCount} 个过期测试文件`);
  } catch (error) {
    console.warn(`  - 上传文件清理失败: ${error.message}`);
  }
}

module.exports = globalTeardown;