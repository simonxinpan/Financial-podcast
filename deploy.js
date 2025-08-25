#!/usr/bin/env node

/**
 * Vercel部署脚本
 * 用于自动化部署静态页面原型到Vercel平台
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VercelDeployer {
  constructor() {
    this.projectRoot = process.cwd();
    this.prototypeDir = path.join(this.projectRoot, 'prototype');
  }

  /**
   * 检查必要文件是否存在
   */
  checkPrerequisites() {
    console.log('🔍 检查部署前置条件...');
    
    // 检查prototype目录
    if (!fs.existsSync(this.prototypeDir)) {
      throw new Error('prototype目录不存在');
    }
    
    // 检查index.html
    const indexPath = path.join(this.prototypeDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('prototype/index.html文件不存在');
    }
    
    // 检查vercel.json
    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    if (!fs.existsSync(vercelConfigPath)) {
      throw new Error('vercel.json配置文件不存在');
    }
    
    console.log('✅ 前置条件检查通过');
  }

  /**
   * 检查Vercel CLI是否安装
   */
  checkVercelCLI() {
    console.log('🔍 检查Vercel CLI...');
    
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ Vercel CLI已安装');
    } catch (error) {
      console.log('❌ Vercel CLI未安装');
      console.log('请运行以下命令安装Vercel CLI:');
      console.log('npm install -g vercel');
      process.exit(1);
    }
  }

  /**
   * 执行部署
   */
  deploy() {
    console.log('🚀 开始部署到Vercel...');
    
    try {
      // 执行部署命令
      const deployCommand = process.argv.includes('--prod') 
        ? 'vercel --prod' 
        : 'vercel';
      
      console.log(`执行命令: ${deployCommand}`);
      execSync(deployCommand, { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      
      console.log('🎉 部署完成!');
      console.log('\n📝 部署信息:');
      console.log('- 项目类型: 静态页面原型');
      console.log('- 主页面: /prototype/index.html');
      console.log('- 配置文件: vercel.json');
      
    } catch (error) {
      console.error('❌ 部署失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 显示使用说明
   */
  showUsage() {
    console.log('\n📖 Vercel部署脚本使用说明:');
    console.log('\n基本部署 (预览环境):');
    console.log('  node deploy.js');
    console.log('\n生产环境部署:');
    console.log('  node deploy.js --prod');
    console.log('\n首次部署步骤:');
    console.log('  1. 安装Vercel CLI: npm install -g vercel');
    console.log('  2. 登录Vercel: vercel login');
    console.log('  3. 运行部署脚本: node deploy.js');
    console.log('\n注意事项:');
    console.log('  - 确保prototype/index.html文件存在');
    console.log('  - 首次部署会要求配置项目设置');
    console.log('  - 生产部署需要确认操作');
  }

  /**
   * 主执行函数
   */
  run() {
    try {
      console.log('🎯 财报播客原型 - Vercel部署工具\n');
      
      // 显示帮助信息
      if (process.argv.includes('--help') || process.argv.includes('-h')) {
        this.showUsage();
        return;
      }
      
      // 执行部署流程
      this.checkPrerequisites();
      this.checkVercelCLI();
      this.deploy();
      
    } catch (error) {
      console.error('❌ 错误:', error.message);
      console.log('\n💡 获取帮助: node deploy.js --help');
      process.exit(1);
    }
  }
}

// 执行部署
if (require.main === module) {
  const deployer = new VercelDeployer();
  deployer.run();
}

module.exports = VercelDeployer;