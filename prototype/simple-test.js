import SubtitleService from './subtitle-service.js';

async function simpleTest() {
    console.log('=== 简单字幕提取测试 ===\n');
    
    const subtitleService = new SubtitleService();
    
    // 测试指定视频
    const testVideoUrl = 'https://www.youtube.com/watch?v=ueNHSL0dIVw';
    console.log(`测试视频: ${testVideoUrl}\n`);
    
    try {
        console.log('开始提取字幕...');
        const result = await subtitleService.downloadSubtitle(testVideoUrl);
        
        console.log('\n✅ 字幕提取成功!');
        console.log(`视频ID: ${result.videoId}`);
        console.log(`提取方式: ${result.method}`);
        console.log(`字幕长度: ${result.subtitleText.length} 字符`);
        console.log(`提取时间: ${result.extractedAt}`);
        console.log(`\n字幕预览 (前300字符):`);
        console.log(result.subtitleText.substring(0, 300) + '...');
        
        return result;
        
    } catch (error) {
        console.error('❌ 字幕提取失败:', error.message);
        throw error;
    }
}

// 直接运行测试
simpleTest()
    .then(result => {
        console.log('\n=== 测试完成 ===');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n=== 测试失败 ===');
        console.error(error);
        process.exit(1);
    });