import SubtitleService from './subtitle-service.js';

async function testSubtitleDeduplication() {
    console.log('=== 测试字幕去重功能 ===\n');
    
    const subtitleService = new SubtitleService();
    
    // 测试视频ID
    const testVideoId = 'K3qMpcjLZGg';
    const testVideoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;
    
    try {
        console.log(`正在提取视频字幕: ${testVideoUrl}`);
        console.log('视频ID:', testVideoId);
        console.log('');
        
        // 下载字幕
        const result = await subtitleService.downloadSubtitle(testVideoUrl);
        
        console.log('字幕提取结果:');
        console.log('- 视频ID:', result.videoId);
        console.log('- 字幕长度:', result.subtitleText.length, '字符');
        console.log('- 提取方法:', result.method);
        console.log('');
        
        // 显示字幕内容的前500个字符
        console.log('字幕内容预览（前500字符）:');
        console.log('=' .repeat(50));
        console.log(result.subtitleText.substring(0, 500));
        console.log('=' .repeat(50));
        console.log('');
        
        // 检查是否还有重复内容
        const words = result.subtitleText.split(' ');
        const uniqueWords = [...new Set(words)];
        const duplicateRatio = (words.length - uniqueWords.length) / words.length;
        
        console.log('重复度分析:');
        console.log('- 总词数:', words.length);
        console.log('- 唯一词数:', uniqueWords.length);
        console.log('- 重复率:', (duplicateRatio * 100).toFixed(2) + '%');
        
        // 检查连续重复的句子
        const sentences = result.subtitleText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        let consecutiveDuplicates = 0;
        for (let i = 1; i < sentences.length; i++) {
            if (sentences[i].trim().toLowerCase() === sentences[i-1].trim().toLowerCase()) {
                consecutiveDuplicates++;
            }
        }
        
        console.log('- 连续重复句子数:', consecutiveDuplicates);
        console.log('- 总句子数:', sentences.length);
        
        if (consecutiveDuplicates === 0) {
            console.log('\n✅ 字幕去重功能正常工作！');
        } else {
            console.log('\n❌ 仍然存在重复内容，需要进一步优化');
        }
        
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

// 运行测试
testSubtitleDeduplication();