import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

class SubtitleService {
    constructor() {
        this.subtitlesDir = path.join(__dirname, 'subtitles');
        this.ensureSubtitlesDirectory();
    }

    /**
     * 确保字幕目录存在
     */
    ensureSubtitlesDirectory() {
        if (!fs.existsSync(this.subtitlesDir)) {
            fs.mkdirSync(this.subtitlesDir, { recursive: true });
        }
    }

    /**
     * 从YouTube URL中提取视频ID
     * @param {string} url - YouTube视频URL
     * @returns {string|null} 视频ID
     */
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/ // 直接的视频ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    /**
     * 从YouTube频道URL中提取频道标识
     * @param {string} url - YouTube频道URL
     * @returns {string|null} 频道标识
     */
    extractChannelId(url) {
        const patterns = [
            /youtube\.com\/@([^\/\?&]+)/,
            /youtube\.com\/channel\/([^\/\?&]+)/,
            /youtube\.com\/c\/([^\/\?&]+)/,
            /youtube\.com\/user\/([^\/\?&]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    /**
     * 使用Node.js的youtube-transcript-api下载字幕
     * @param {string} videoId - YouTube视频ID
     * @returns {Promise<string>} 清洗后的字幕文本
     */
    async downloadSubtitleWithNodejs(videoId) {
        try {
            // 使用youtube-transcript-api获取字幕
            const { YoutubeTranscript } = await import('youtube-transcript');
            
            console.log(`正在获取视频 ${videoId} 的字幕...`);
            
            // 获取字幕数据
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
                lang: 'en', // 优先获取英文字幕
                country: 'US'
            });

            if (!transcript || transcript.length === 0) {
                throw new Error('未找到字幕数据');
            }

            // 提取并清洗文本
            const cleanText = transcript
                .map(item => item.text)
                .join(' ')
                .replace(/\[.*?\]/g, '') // 移除方括号内容
                .replace(/\(.*?\)/g, '') // 移除圆括号内容
                .replace(/\s+/g, ' ') // 合并多个空格
                .trim();

            console.log(`字幕提取成功，文本长度: ${cleanText.length} 字符`);
            
            // 保存到文件
            const filePath = path.join(this.subtitlesDir, `${videoId}.txt`);
            fs.writeFileSync(filePath, cleanText, 'utf8');
            
            return cleanText;

        } catch (error) {
            console.error(`Node.js方式获取字幕失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 使用yt-dlp命令行工具下载字幕（备用方案）
     * @param {string} videoId - YouTube视频ID
     * @returns {Promise<string>} 清洗后的字幕文本
     */
    async downloadSubtitleWithYtDlp(videoId) {
        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const outputPath = path.join(this.subtitlesDir, `${videoId}.%(ext)s`);
            
            // yt-dlp命令
            const command = `.\\tools\\yt-dlp.exe --write-auto-subs --sub-lang en --sub-format vtt --skip-download -o "${outputPath}" "${videoUrl}"`;
            
            console.log(`执行命令: ${command}`);
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('WARNING')) {
                console.error('yt-dlp stderr:', stderr);
            }
            
            // 查找生成的VTT文件
            const vttFile = path.join(this.subtitlesDir, `${videoId}.en.vtt`);
            
            if (!fs.existsSync(vttFile)) {
                throw new Error(`VTT文件未生成: ${vttFile}`);
            }
            
            // 清洗VTT文件
            const cleanText = this.cleanVttFile(vttFile);
            
            // 保存清洗后的文本
            const txtFile = path.join(this.subtitlesDir, `${videoId}.txt`);
            fs.writeFileSync(txtFile, cleanText, 'utf8');
            
            // 删除原始VTT文件
            fs.unlinkSync(vttFile);
            
            return cleanText;
            
        } catch (error) {
            console.error(`yt-dlp方式获取字幕失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 清洗VTT文件，提取纯文本
     * @param {string} vttFilePath - VTT文件路径
     * @returns {string} 清洗后的文本
     */
    cleanVttFile(vttFilePath) {
        try {
            const content = fs.readFileSync(vttFilePath, 'utf8');
            
            // 移除VTT头部信息
            let lines = content.split('\n');
            
            // 跳过WEBVTT头部
            let startIndex = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() === '' && i > 0) {
                    startIndex = i + 1;
                    break;
                }
            }
            
            const textLines = [];
            
            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // 跳过时间戳行（包含 --> 的行）
                if (line.includes('-->')) {
                    continue;
                }
                
                // 跳过空行和数字行（序号）
                if (line === '' || /^\d+$/.test(line)) {
                    continue;
                }
                
                // 跳过NOTE行和其他元数据
                if (line.startsWith('NOTE') || line.startsWith('WEBVTT')) {
                    continue;
                }
                
                // 移除HTML标签和特殊字符
                const cleanLine = line
                    .replace(/<[^>]*>/g, '') // 移除HTML标签
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\[.*?\]/g, '') // 移除方括号内容
                    .replace(/\(.*?\)/g, '') // 移除圆括号内容
                    .trim();
                
                if (cleanLine) {
                    textLines.push(cleanLine);
                }
            }
            
            // 智能去重处理
            const deduplicatedText = this.removeDuplicateText(textLines);
            
            console.log(`VTT文件清洗完成，原始行数: ${textLines.length}，去重后文本长度: ${deduplicatedText.length} 字符`);
            
            return deduplicatedText;
            
        } catch (error) {
            console.error(`清洗VTT文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 智能去重文本内容
     * @param {Array} textLines - 文本行数组
     * @returns {string} 去重后的文本
     */
    removeDuplicateText(textLines) {
        if (!textLines || textLines.length === 0) {
            return '';
        }
        
        // 将所有文本合并并分词
        const fullText = textLines.join(' ').replace(/\s+/g, ' ').trim();
        
        if (!fullText) {
            return '';
        }
        
        // 第一步：基础清理
        let cleanText = fullText
            .replace(/\s+/g, ' ')  // 多个空格合并为一个
            .trim();

        // 第二步：移除短语级别的重复（2-20个词的重复模式）
        cleanText = this.removePatternRepeats(cleanText);

        // 第三步：移除句子级别的重复
        cleanText = this.removeSentenceRepeats(cleanText);

        // 第四步：移除相邻重复词
        cleanText = this.removeAdjacentDuplicates(cleanText);

        return cleanText;
    }

    removePatternRepeats(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        if (words.length < 4) return text;

        const result = [];
        let i = 0;

        while (i < words.length) {
            let foundRepeat = false;
            
            // 从长到短检查重复模式（20个词到2个词）
            for (let patternLength = Math.min(20, Math.floor((words.length - i) / 2)); patternLength >= 2; patternLength--) {
                if (i + patternLength >= words.length) continue;
                
                const pattern = words.slice(i, i + patternLength);
                let repeatCount = 1;
                let checkIndex = i + patternLength;
                
                // 计算连续重复次数
                while (checkIndex + patternLength <= words.length) {
                    const nextSegment = words.slice(checkIndex, checkIndex + patternLength);
                    
                    // 计算相似度（允许小的差异）
                    let matches = 0;
                    for (let j = 0; j < patternLength; j++) {
                        if (pattern[j] === nextSegment[j]) {
                            matches++;
                        }
                    }
                    
                    const similarity = matches / patternLength;
                    
                    // 如果相似度超过85%，认为是重复
                    if (similarity >= 0.85) {
                        repeatCount++;
                        checkIndex += patternLength;
                    } else {
                        break;
                    }
                }
                
                // 如果发现重复（至少重复2次），只保留一次
                if (repeatCount >= 2) {
                    result.push(...pattern);
                    i = checkIndex;
                    foundRepeat = true;
                    break;
                }
            }
            
            if (!foundRepeat) {
                result.push(words[i]);
                i++;
            }
        }

        return result.join(' ');
    }

    removeSentenceRepeats(text) {
        // 按句子分割（基于标点符号）
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length <= 1) return text;

        const uniqueSentences = [];
        const seenSentences = new Set();

        for (let sentence of sentences) {
            const cleanSentence = sentence.trim().toLowerCase();
            
            // 生成句子的关键词指纹
            const words = cleanSentence.split(/\s+/).filter(w => w.length > 2);
            const fingerprint = words.slice(0, 5).join(' '); // 取前5个有意义的词作为指纹
            
            // 检查是否与已有句子过于相似
            let isDuplicate = false;
            for (let seenFingerprint of seenSentences) {
                const similarity = this.calculateSimilarity(fingerprint, seenFingerprint);
                if (similarity > 0.8) {
                    isDuplicate = true;
                    break;
                }
            }
            
            if (!isDuplicate && words.length >= 3) { // 至少3个有意义的词
                uniqueSentences.push(sentence.trim());
                seenSentences.add(fingerprint);
            }
        }

        return uniqueSentences.join('. ') + (uniqueSentences.length > 0 ? '.' : '');
    }

    removeAdjacentDuplicates(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const result = [];
        
        for (let i = 0; i < words.length; i++) {
            // 检查是否与前面的词重复
            if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
                result.push(words[i]);
            }
        }
        
        return result.join(' ');
    }

    calculateSimilarity(str1, str2) {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        const maxLength = Math.max(words1.length, words2.length);
        
        if (maxLength === 0) return 1;
        
        let matches = 0;
        const minLength = Math.min(words1.length, words2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (words1[i] === words2[i]) {
                matches++;
            }
        }
        
        return matches / maxLength;
    }

    /**
     * 判断两个句子是否相似（用于去重）
     * @param {string} sentence1 - 句子1
     * @param {string} sentence2 - 句子2
     * @returns {boolean} 是否相似
     */
    isSimilarSentence(sentence1, sentence2) {
        // 如果句子完全相同
        if (sentence1 === sentence2) return true;
        
        // 如果一个句子包含另一个句子的80%以上内容
        const words1 = sentence1.split(/\s+/);
        const words2 = sentence2.split(/\s+/);
        
        if (words1.length === 0 || words2.length === 0) return false;
        
        // 计算词汇重叠度
        const commonWords = words1.filter(word => words2.includes(word));
        const overlapRatio1 = commonWords.length / words1.length;
        const overlapRatio2 = commonWords.length / words2.length;
        
        // 如果重叠度超过80%，认为是重复
        return overlapRatio1 > 0.8 || overlapRatio2 > 0.8;
    }

    /**
     * 下载单个视频的字幕
     * @param {string} videoUrl - YouTube视频URL或视频ID
     * @returns {Promise<Object>} 包含视频ID和字幕文本的对象
     */
    async downloadSubtitle(videoUrl) {
        const videoId = this.extractVideoId(videoUrl);
        
        if (!videoId) {
            throw new Error(`无效的YouTube视频URL: ${videoUrl}`);
        }
        
        console.log(`开始提取视频字幕: ${videoId}`);
        
        try {
            // 首先尝试Node.js方式（更快更稳定）
            const subtitleText = await this.downloadSubtitleWithNodejs(videoId);
            
            return {
                videoId,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                subtitleText,
                extractedAt: new Date().toISOString(),
                method: 'nodejs'
            };
            
        } catch (nodeError) {
            console.log(`Node.js方式失败，尝试yt-dlp方式...`);
            
            try {
                // 备用方案：使用yt-dlp
                const subtitleText = await this.downloadSubtitleWithYtDlp(videoId);
                
                return {
                    videoId,
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    subtitleText,
                    extractedAt: new Date().toISOString(),
                    method: 'yt-dlp'
                };
                
            } catch (ytdlpError) {
                throw new Error(`所有方式都失败了。Node.js错误: ${nodeError.message}, yt-dlp错误: ${ytdlpError.message}`);
            }
        }
    }

    /**
     * 获取频道的最新视频列表
     * @param {string} channelUrl - YouTube频道URL
     * @param {number} limit - 获取视频数量限制
     * @returns {Promise<Array>} 视频列表
     */
    async getChannelVideos(channelUrl, limit = 10) {
        try {
            const channelId = this.extractChannelId(channelUrl);
            
            if (!channelId) {
                throw new Error(`无效的YouTube频道URL: ${channelUrl}`);
            }
            
            console.log(`获取频道视频列表: ${channelId}`);
            
            // 使用yt-dlp获取频道视频列表
            const command = `.\\tools\\yt-dlp.exe --flat-playlist --print "%(id)s|%(title)s|%(upload_date)s" "${channelUrl}"`;
            
            const { stdout } = await execAsync(command);
            
            const videos = stdout
                .trim()
                .split('\n')
                .filter(line => line.trim())
                .slice(0, limit) // 在JavaScript中限制数量
                .map(line => {
                    const [id, title, uploadDate] = line.split('|');
                    return {
                        videoId: id,
                        title: title || 'Unknown Title',
                        uploadDate: uploadDate || 'Unknown Date',
                        url: `https://www.youtube.com/watch?v=${id}`
                    };
                });
            
            console.log(`找到 ${videos.length} 个视频`);
            
            return videos;
            
        } catch (error) {
            console.error(`获取频道视频失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 批量下载频道视频的字幕
     * @param {string} channelUrl - YouTube频道URL
     * @param {number} limit - 处理视频数量限制
     * @returns {Promise<Array>} 字幕提取结果数组
     */
    async batchDownloadChannelSubtitles(channelUrl, limit = 5) {
        try {
            console.log(`开始批量提取频道字幕: ${channelUrl}`);
            
            // 获取频道视频列表
            const videos = await this.getChannelVideos(channelUrl, limit);
            
            const results = [];
            
            // 逐个处理视频
            for (const video of videos) {
                try {
                    console.log(`处理视频: ${video.title} (${video.videoId})`);
                    
                    const result = await this.downloadSubtitle(video.videoId);
                    result.title = video.title;
                    result.uploadDate = video.uploadDate;
                    
                    results.push(result);
                    
                    // 添加延迟避免请求过于频繁
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`处理视频 ${video.videoId} 失败: ${error.message}`);
                    results.push({
                        videoId: video.videoId,
                        title: video.title,
                        error: error.message,
                        extractedAt: new Date().toISOString()
                    });
                }
            }
            
            console.log(`批量处理完成，成功: ${results.filter(r => !r.error).length}/${results.length}`);
            
            return results;
            
        } catch (error) {
            console.error(`批量下载失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取已保存的字幕文件列表
     * @returns {Array} 字幕文件信息数组
     */
    getSubtitleFiles() {
        try {
            const files = fs.readdirSync(this.subtitlesDir);
            
            return files
                .filter(file => file.endsWith('.txt'))
                .map(file => {
                    const videoId = path.basename(file, '.txt');
                    const filePath = path.join(this.subtitlesDir, file);
                    const stats = fs.statSync(filePath);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    return {
                        videoId,
                        fileName: file,
                        filePath,
                        size: stats.size,
                        textLength: content.length,
                        createdAt: stats.birthtime.toISOString(),
                        modifiedAt: stats.mtime.toISOString()
                    };
                })
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
        } catch (error) {
            console.error(`获取字幕文件列表失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 读取指定视频的字幕文本
     * @param {string} videoId - 视频ID
     * @returns {string|null} 字幕文本
     */
    getSubtitleText(videoId) {
        try {
            const filePath = path.join(this.subtitlesDir, `${videoId}.txt`);
            
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8');
            }
            
            return null;
            
        } catch (error) {
            console.error(`读取字幕文件失败: ${error.message}`);
            return null;
        }
    }
}

export default SubtitleService;