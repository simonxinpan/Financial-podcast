/**
 * Finnhub API 服务模块
 * 功能：获取股票财报电话会议文字稿
 */

import fetch from 'node-fetch';

export class FinnhubService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Finnhub API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://finnhub.io/api/v1';
  }

  /**
   * 获取财报电话会议文字稿
   * @param {Object} params - 参数对象
   * @param {string} params.symbol - 股票代码
   * @param {number} params.year - 年份
   * @param {number} params.quarter - 季度 (1-4)
   * @returns {Promise<string>} 文字稿内容
   */
  async getEarningsTranscript({ symbol, year, quarter }) {
    try {
      // 验证参数
      if (!symbol || !year || !quarter) {
        throw new Error('Symbol, year, and quarter are required');
      }

      if (quarter < 1 || quarter > 4) {
        throw new Error('Quarter must be between 1 and 4');
      }

      // 构建API请求URL
      const url = new URL(`${this.baseUrl}/stock/transcripts`);
      url.searchParams.append('symbol', symbol.toUpperCase());
      url.searchParams.append('year', year.toString());
      url.searchParams.append('quarter', quarter.toString());
      url.searchParams.append('token', this.apiKey);

      console.log(`📡 正在获取 ${symbol} ${year}Q${quarter} 财报文字稿...`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Financial-Podcast-Generator/1.0'
        },
        timeout: 30000 // 30秒超时
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Finnhub API authentication failed. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Finnhub API rate limit exceeded. Please try again later.');
        } else if (response.status === 404) {
          throw new Error(`No earnings transcript found for ${symbol} ${year}Q${quarter}`);
        } else {
          throw new Error(`Finnhub API request failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      // 检查返回数据
      if (!data || !data.transcript) {
        throw new Error(`No transcript data available for ${symbol} ${year}Q${quarter}`);
      }

      const transcript = data.transcript;
      
      // 验证文字稿内容
      if (typeof transcript !== 'string' || transcript.trim().length === 0) {
        throw new Error('Invalid or empty transcript content');
      }

      // 基本的内容清理
      const cleanedTranscript = this.cleanTranscript(transcript);

      console.log(`✅ 文字稿获取成功: ${cleanedTranscript.length} 字符, ${cleanedTranscript.split(' ').length} 单词`);

      return cleanedTranscript;

    } catch (error) {
      console.error(`❌ 获取财报文字稿失败:`, error.message);
      throw error;
    }
  }

  /**
   * 清理文字稿内容
   * @param {string} transcript - 原始文字稿
   * @returns {string} 清理后的文字稿
   */
  cleanTranscript(transcript) {
    return transcript
      // 移除多余的空白字符
      .replace(/\s+/g, ' ')
      // 移除特殊字符和控制字符
      .replace(/[\x00-\x1F\x7F]/g, '')
      // 标准化引号
      .replace(/[