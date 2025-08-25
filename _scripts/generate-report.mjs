#!/usr/bin/env node

/**
 * 财报播客自动生成器 - 主执行脚本
 * 功能：协调整个财报播客生成流程
 */

import { parseArgs } from 'node:util';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 导入核心服务模块
import { FinnhubService } from '../src/services/finnhub.js';
import { GeminiService } from '../src/services/gemini.js';
import { CozeService } from '../src/services/coze.js';
import { DatabaseService } from '../src/utils/database.js';
import { Logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 解析命令行参数
const { values: args } = parseArgs({
  options: {
    ticker: { type: 'string' },
    year: { type: 'string' },
    quarter: { type: 'string' },
    language: { type: 'string', default: 'zh-CN' }
  }
});

// 验证必需参数
if (!args.ticker || !args.year || !args.quarter) {
  console.error('❌ 缺少必需参数: --ticker, --year, --quarter');
  process.exit(1);
}

// 初始化日志记录器
const logger = new Logger({
  outputDir: path.join(projectRoot, 'logs'),
  filename: `${args.ticker}-${args.year}Q${args.quarter}-${Date.now()}.log`
});

// 初始化服务
const finnhub = new FinnhubService(process.env.FINNHUB_API_KEY);
const gemini = new GeminiService(process.env.GEMINI_API_KEY);
const coze = new CozeService(process.env.COZE_API_KEY);
const database = new DatabaseService(process.env.NEON_DATABASE_URL);

async function main() {
  try {
    logger.info('🚀 开始生成财报播客', {
      ticker: args.ticker,
      year: args.year,
      quarter: args.quarter,
      language: args.language
    });

    // 创建输出目录
    const outputDir = path.join(projectRoot, 'output', `${args.ticker}-${args.year}Q${args.quarter}`);
    await mkdir(outputDir, { recursive: true });

    // 步骤1: 获取财报文字稿
    logger.info('📄 获取财报文字稿...');
    const transcript = await finnhub.getEarningsTranscript({
      symbol: args.ticker,
      year: parseInt(args.year),
      quarter: parseInt(args.quarter)
    });
    
    if (!transcript) {
      throw new Error(`未找到 ${args.ticker} ${args.year}Q${args.quarter} 的财报文字稿`);
    }
    
    logger.info('✅ 财报文字稿获取成功', { 
      length: transcript.length,
      wordCount: transcript.split(' ').length 
    });

    // 步骤2: 生成AI摘要
    logger.info('🤖 生成AI摘要...');
    const summary = await gemini.generateSummary({
      transcript,
      ticker: args.ticker,
      year: args.year,
      quarter: args.quarter,
      language: args.language
    });
    
    logger.info('✅ AI摘要生成成功', { 
      summaryLength: summary.length 
    });

    // 步骤3: 生成语音播客
    logger.info('🎙️ 生成语音播客...');
    const audioBuffer = await coze.generateSpeech({
      text: summary,
      language: args.language,
      voice: args.language === 'zh-CN' ? 'zh-CN-XiaoxiaoNeural' : 'en-US-JennyNeural'
    });
    
    logger.info('✅ 语音播客生成成功', { 
      audioSize: audioBuffer.length 
    });

    // 步骤4: 保存到数据库
    logger.info('💾 保存到数据库...');
    const recordId = await database.saveEarningsReport({
      ticker: args.ticker,
      year: parseInt(args.year),
      quarter: parseInt(args.quarter),
      transcript,
      summary,
      audioBuffer,
      language: args.language,
      metadata: {
        generatedAt: new Date().toISOString(),
        transcriptWordCount: transcript.split(' ').length,
        summaryLength: summary.length,
        audioSize: audioBuffer.length
      }
    });
    
    logger.info('✅ 数据保存成功', { recordId });

    // 步骤5: 保存本地文件
    logger.info('📁 保存本地文件...');
    await Promise.all([
      // 保存原始文字稿
      import('node:fs/promises').then(fs => 
        fs.writeFile(
          path.join(outputDir, 'transcript.txt'), 
          transcript, 
          'utf-8'
        )
      ),
      // 保存AI摘要
      import('node:fs/promises').then(fs => 
        fs.writeFile(
          path.join(outputDir, 'summary.md'), 
          summary, 
          'utf-8'
        )
      ),
      // 保存音频文件
      import('node:fs/promises').then(fs => 
        fs.writeFile(
          path.join(outputDir, 'podcast.mp3'), 
          audioBuffer
        )
      )
    ]);
    
    logger.info('✅ 本地文件保存成功', { outputDir });

    // 生成报告摘要
    const report = {
      ticker: args.ticker,
      period: `${args.year}Q${args.quarter}`,
      language: args.language,
      recordId,
      files: {
        transcript: path.join(outputDir, 'transcript.txt'),
        summary: path.join(outputDir, 'summary.md'),
        podcast: path.join(outputDir, 'podcast.mp3')
      },
      metrics: {
        transcriptWordCount: transcript.split(' ').length,
        summaryLength: summary.length,
        audioSize: audioBuffer.length,
        processingTime: Date.now() - startTime
      }
    };

    // 保存报告
    await import('node:fs/promises').then(fs => 
      fs.writeFile(
        path.join(outputDir, 'report.json'), 
        JSON.stringify(report, null, 2), 
        'utf-8'
      )
    );

    logger.info('🎉 财报播客生成完成!', report);
    
    console.log('\n🎉 财报播客生成成功!');
    console.log(`📊 股票代码: ${args.ticker}`);
    console.log(`📅 财报期间: ${args.year}Q${args.quarter}`);
    console.log(`🌐 语言: ${args.language}`);
    console.log(`📁 输出目录: ${outputDir}`);
    console.log(`🆔 数据库记录ID: ${recordId}`);
    console.log(`⏱️ 处理时间: ${Math.round((Date.now() - startTime) / 1000)}秒`);
    
  } catch (error) {
    logger.error('❌ 财报播客生成失败', {
      error: error.message,
      stack: error.stack,
      args
    });
    
    console.error('\n❌ 财报播客生成失败!');
    console.error(`错误信息: ${error.message}`);
    
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await database.close();
    logger.info('🔚 脚本执行结束');
  }
}

// 记录开始时间
const startTime = Date.now();

// 执行主函数
main().catch(error => {
  console.error('💥 未捕获的错误:', error);
  process.exit(1);
});