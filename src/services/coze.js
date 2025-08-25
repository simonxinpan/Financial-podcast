/**
 * Coze TTS 服务模块
 * 功能：将文本转换为语音播客
 */

import fetch from 'node-fetch';

export class CozeService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Coze API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.coze.cn/v1';
  }

  /**
   * 生成语音播客
   * @param {Object} params - 参数对象
   * @param {string} params.text - 要转换的文本
   * @param {string} params.language - 语言代码 (zh-CN 或 en-US)
   * @param {string} params.voice - 语音类型
   * @param {number} params.speed - 语速 (0.5-2.0)
   * @param {string} params.format - 音频格式 (mp3, wav)
   * @returns {Promise<Buffer>} 音频数据
   */
  async generateSpeech({ 
    text, 
    language = 'zh-CN', 
    voice = null, 
    speed = 1.0, 
    format = 'mp3' 
  }) {
    try {
      console.log(`🎙️ 正在生成${language === 'zh-CN' ? '中文' : '英文'}语音播客...`);

      // 验证输入
      if (!text || text.trim().length === 0) {
        throw new Error('Text content is required');
      }

      if (text.length > 10000) {
        console.warn('⚠️ 文本内容过长，将进行分段处理');
        return await this.generateLongSpeech({ text, language, voice, speed, format });
      }

      // 选择合适的语音
      const selectedVoice = voice || this.getDefaultVoice(language);

      // 预处理文本
      const processedText = this.preprocessText(text, language);

      // 构建请求数据
      const requestData = {
        text: processedText,
        voice: selectedVoice,
        speed: Math.max(0.5, Math.min(2.0, speed)),
        format: format,
        language: language
      };

      console.log(`📝 文本长度: ${processedText.length} 字符`);
      console.log(`🎵 使用语音: ${selectedVoice}`);
      console.log(`⚡ 语速设置: ${speed}x`);

      // 发送TTS请求
      const response = await fetch(`${this.baseUrl}/tts/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Financial-Podcast-Generator/1.0'
        },
        body: JSON.stringify(requestData),
        timeout: 60000 // 60秒超时
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Coze API authentication failed. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Coze API rate limit exceeded. Please try again later.');
        } else if (response.status === 400) {
          throw new Error(`Invalid request: ${errorData.message || 'Bad request'}`);
        } else {
          throw new Error(`Coze API request failed: ${response.status} ${response.statusText}`);
        }
      }

      // 获取音频数据
      const audioBuffer = await response.buffer();

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Generated audio is empty');
      }

      // 验证音频格式
      this.validateAudioBuffer(audioBuffer, format);

      console.log(`✅ 语音生成成功: ${audioBuffer.length} 字节`);
      console.log(`🎵 预估播放时长: ${this.estimateAudioDuration(processedText, speed)} 分钟`);

      return audioBuffer;

    } catch (error) {
      console.error(`❌ 生成语音失败:`, error.message);
      throw error;
    }
  }

  /**
   * 处理长文本的语音生成
   * @param {Object} params - 参数对象
   * @returns {Promise<Buffer>} 合并后的音频数据
   */
  async generateLongSpeech({ text, language, voice, speed, format }) {
    console.log('📄 检测到长文本，开始分段处理...');

    // 将文本分段
    const segments = this.splitTextIntoSegments(text, 8000);
    console.log(`📊 文本已分为 ${segments.length} 段`);

    const audioBuffers = [];

    for (let i = 0; i < segments.length; i++) {
      console.log(`🎙️ 正在处理第 ${i + 1}/${segments.length} 段...`);
      
      try {
        const segmentAudio = await this.generateSpeech({
          text: segments[i],
          language,
          voice,
          speed,
          format
        });
        
        audioBuffers.push(segmentAudio);
        
        // 添加段间延迟，避免API限制
        if (i < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ 第 ${i + 1} 段处理失败:`, error.message);
        throw error;
      }
    }

    // 合并音频片段
    console.log('🔗 正在合并音频片段...');
    const mergedBuffer = Buffer.concat(audioBuffers);
    
    console.log(`✅ 长文本语音生成完成: ${mergedBuffer.length} 字节`);
    return mergedBuffer;
  }

  /**
   * 获取默认语音
   * @param {string} language - 语言代码
   * @returns {string} 默认语音ID
   */
  getDefaultVoice(language) {
    const voiceMap = {
      'zh-CN': 'zh-CN-XiaoxiaoNeural',  // 中文女声
      'zh-TW': 'zh-TW-HsiaoyuNeural',   // 繁体中文女声
      'en-US': 'en-US-JennyNeural',     // 英文女声
      'en-GB': 'en-GB-SoniaNeural'      // 英式英语女声
    };
    
    return voiceMap[language] || voiceMap['zh-CN'];
  }

  /**
   * 预处理文本
   * @param {string} text - 原始文本
   * @param {string} language - 语言代码
   * @returns {string} 处理后的文本
   */
  preprocessText(text, language) {
    let processed = text
      // 移除Markdown格式
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      // 处理列表
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // 处理链接
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 标准化空白字符
      .replace(/\s+/g, ' ')
      .trim();

    if (language === 'zh-CN') {
      // 中文特殊处理
      processed = processed
        // 添加适当的停顿
        .replace(/([。！？])([^\s])/g, '$1 $2')
        .replace(/([，；])([^\s])/g, '$1$2')
        // 处理数字读音
        .replace(/\b(\d+)%/g, '百分之$1')
        .replace(/\$([\d,]+)/g, '$1美元');
    } else {
      // 英文特殊处理
      processed = processed
        // 确保句子间有适当停顿
        .replace(/([.!?])([A-Z])/g, '$1 $2')
        // 处理缩写
        .replace(/\bQ(\d)/g, 'Quarter $1')
        .replace(/\bYoY\b/g, 'year over year')
        .replace(/\bQoQ\b/g, 'quarter over quarter');
    }

    return processed;
  }

  /**
   * 将文本分割成段落
   * @param {string} text - 原始文本
   * @param {number} maxLength - 每段最大长度
   * @returns {string[]} 文本段落数组
   */
  splitTextIntoSegments(text, maxLength = 8000) {
    const segments = [];
    const sentences = text.split(/[。！？.!?]\s*/);
    
    let currentSegment = '';
    
    for (const sentence of sentences) {
      if (sentence.trim().length === 0) continue;
      
      const sentenceWithPunctuation = sentence + (sentence.match(/[。！？.!?]$/) ? '' : '。');
      
      if ((currentSegment + sentenceWithPunctuation).length > maxLength) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment.trim());
          currentSegment = sentenceWithPunctuation;
        } else {
          // 单个句子过长，强制分割
          segments.push(sentenceWithPunctuation.substring(0, maxLength));
          currentSegment = sentenceWithPunctuation.substring(maxLength);
        }
      } else {
        currentSegment += sentenceWithPunctuation;
      }
    }
    
    if (currentSegment.trim().length > 0) {
      segments.push(currentSegment.trim());
    }
    
    return segments;
  }

  /**
   * 验证音频数据
   * @param {Buffer} audioBuffer - 音频数据
   * @param {string} format - 音频格式
   */
  validateAudioBuffer(audioBuffer, format) {
    if (format === 'mp3') {
      // 检查MP3文件头
      const header = audioBuffer.slice(0, 3);
      if (!header.equals(Buffer.from([0xFF, 0xFB, 0x90])) && 
          !header.equals(Buffer.from([0x49, 0x44, 0x33]))) {
        console.warn('⚠️ 音频文件可能不是有效的MP3格式');
      }
    }
    
    // 检查文件大小
    if (audioBuffer.length < 1000) {
      console.warn('⚠️ 生成的音频文件可能过小');
    }
  }

  /**
   * 估算音频时长
   * @param {string} text - 文本内容
   * @param {number} speed - 语速
   * @returns {number} 预估时长（分钟）
   */
  estimateAudioDuration(text, speed = 1.0) {
    // 中文：每分钟约200-250字
    // 英文：每分钟约150-200词
    const isChineseText = /[\u4e00-\u9fff]/.test(text);
    const wordsPerMinute = isChineseText ? 225 : 175;
    
    const wordCount = isChineseText ? text.length : text.split(/\s+/).length;
    const baseDuration = wordCount / wordsPerMinute;
    
    return Math.round((baseDuration / speed) * 10) / 10; // 保留一位小数
  }

  /**
   * 获取支持的语音列表
   * @returns {Object} 支持的语音映射
   */
  getSupportedVoices() {
    return {
      'zh-CN': {
        'xiaoxiao': 'zh-CN-XiaoxiaoNeural',
        'yunxi': 'zh-CN-YunxiNeural',
        'yunjian': 'zh-CN-YunjianNeural'
      },
      'en-US': {
        'jenny': 'en-US-JennyNeural',
        'guy': 'en-US-GuyNeural',
        'aria': 'en-US-AriaNeural'
      }
    };
  }

  /**
   * 获取服务信息
   * @returns {Object} 服务信息
   */
  getServiceInfo() {
    return {
      provider: 'Coze',
      service: 'TTS',
      supportedFormats: ['mp3', 'wav'],
      supportedLanguages: ['zh-CN', 'zh-TW', 'en-US', 'en-GB'],
      maxTextLength: 10000,
      speedRange: [0.5, 2.0]
    };
  }
}