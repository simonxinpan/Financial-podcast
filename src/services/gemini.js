/**
 * Google Gemini AI 服务模块
 * 功能：生成财报摘要和分析
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GeminiService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  /**
   * 生成财报摘要
   * @param {Object} params - 参数对象
   * @param {string} params.transcript - 财报文字稿
   * @param {string} params.ticker - 股票代码
   * @param {string} params.year - 年份
   * @param {string} params.quarter - 季度
   * @param {string} params.language - 输出语言 (zh-CN 或 en-US)
   * @returns {Promise<string>} 生成的摘要
   */
  async generateSummary({ transcript, ticker, year, quarter, language = 'zh-CN' }) {
    try {
      console.log(`🤖 正在为 ${ticker} ${year}Q${quarter} 生成${language === 'zh-CN' ? '中文' : '英文'}摘要...`);

      // 验证输入
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript content is required');
      }

      if (transcript.length > 100000) {
        console.warn('⚠️ 文字稿内容过长，将进行截取处理');
        transcript = transcript.substring(0, 100000) + '\n\n[内容已截取]';
      }

      // 加载提示词模板
      const promptTemplate = await this.loadPromptTemplate(language);
      
      // 构建完整的提示词
      const prompt = promptTemplate
        .replace('{TICKER}', ticker.toUpperCase())
        .replace('{YEAR}', year)
        .replace('{QUARTER}', quarter)
        .replace('{TRANSCRIPT}', transcript);

      // 调用Gemini API
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      });

      const response = await result.response;
      const summary = response.text();

      if (!summary || summary.trim().length === 0) {
        throw new Error('Generated summary is empty');
      }

      // 验证摘要质量
      this.validateSummary(summary, language);

      console.log(`✅ 摘要生成成功: ${summary.length} 字符`);
      
      return summary.trim();

    } catch (error) {
      console.error(`❌ 生成摘要失败:`, error.message);
      throw error;
    }
  }

  /**
   * 加载提示词模板
   * @param {string} language - 语言代码
   * @returns {Promise<string>} 提示词模板
   */
  async loadPromptTemplate(language) {
    try {
      const templateFile = language === 'zh-CN' 
        ? 'summary_prompt_zh.txt' 
        : 'summary_prompt_en.txt';
      
      const templatePath = path.join(__dirname, '..', 'templates', templateFile);
      
      try {
        const template = await fs.readFile(templatePath, 'utf-8');
        return template;
      } catch (fileError) {
        console.warn(`⚠️ 无法加载模板文件 ${templateFile}，使用默认模板`);
        return this.getDefaultPromptTemplate(language);
      }
    } catch (error) {
      console.warn('⚠️ 加载提示词模板失败，使用默认模板');
      return this.getDefaultPromptTemplate(language);
    }
  }

  /**
   * 获取默认提示词模板
   * @param {string} language - 语言代码
   * @returns {string} 默认提示词模板
   */
  getDefaultPromptTemplate(language) {
    if (language === 'zh-CN') {
      return `你是一位专业的财务分析师，请为以下财报电话会议内容生成一份高质量的中文播客脚本。

公司信息：
- 股票代码：{TICKER}
- 财报期间：{YEAR}年第{QUARTER}季度

请按照以下结构生成播客脚本：

## 📊 财报概览
[简要介绍公司本季度的整体表现]

## 💰 关键财务数据
[重点分析营收、利润、现金流等核心指标]

## 🎯 业务亮点
[突出本季度的主要成就和积极因素]

## ⚠️ 风险与挑战
[客观分析面临的困难和潜在风险]

## 🔮 管理层展望
[总结管理层对未来的预期和规划]

## 📈 投资要点
[为投资者提供关键的投资参考信息]

要求：
1. 语言简洁明了，适合播客收听
2. 重点突出，避免冗余信息
3. 客观中性，不提供投资建议
4. 控制在800-1200字之间
5. 使用专业但易懂的财务术语

财报文字稿内容：
{TRANSCRIPT}`;
    } else {
      return `You are a professional financial analyst. Please generate a high-quality English podcast script for the following earnings call transcript.

Company Information:
- Ticker: {TICKER}
- Period: Q{QUARTER} {YEAR}

Please structure the podcast script as follows:

## 📊 Earnings Overview
[Brief introduction to the company's overall performance this quarter]

## 💰 Key Financial Metrics
[Focus on revenue, profit, cash flow and other core indicators]

## 🎯 Business Highlights
[Highlight major achievements and positive factors this quarter]

## ⚠️ Risks and Challenges
[Objectively analyze difficulties and potential risks]

## 🔮 Management Outlook
[Summarize management's expectations and plans for the future]

## 📈 Investment Takeaways
[Provide key investment reference information for investors]

Requirements:
1. Clear and concise language suitable for podcast listening
2. Focus on key points, avoid redundant information
3. Objective and neutral, do not provide investment advice
4. Keep between 800-1200 words
5. Use professional but understandable financial terminology

Earnings transcript content:
{TRANSCRIPT}`;
    }
  }

  /**
   * 验证摘要质量
   * @param {string} summary - 生成的摘要
   * @param {string} language - 语言代码
   */
  validateSummary(summary, language) {
    // 检查长度
    if (summary.length < 500) {
      console.warn('⚠️ 生成的摘要可能过短');
    }
    
    if (summary.length > 5000) {
      console.warn('⚠️ 生成的摘要可能过长');
    }

    // 检查是否包含关键部分
    const requiredSections = language === 'zh-CN' 
      ? ['财报概览', '关键财务', '业务亮点', '风险', '展望']
      : ['Overview', 'Financial', 'Highlights', 'Risk', 'Outlook'];
    
    const missingSections = requiredSections.filter(section => 
      !summary.toLowerCase().includes(section.toLowerCase())
    );
    
    if (missingSections.length > 2) {
      console.warn(`⚠️ 摘要可能缺少关键部分: ${missingSections.join(', ')}`);
    }
  }

  /**
   * 获取模型信息
   * @returns {Object} 模型信息
   */
  getModelInfo() {
    return {
      provider: 'Google',
      model: 'gemini-1.5-pro',
      maxTokens: 4096,
      temperature: 0.3
    };
  }
}