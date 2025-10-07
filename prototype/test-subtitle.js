import SubtitleService from './subtitle-service.js';

async function testSubtitleExtraction() {
    const subtitleService = new SubtitleService();
    
    console.log('=== YouTube字幕提取测试 ===\n');
    
    // 测试指定视频
    const testVideoUrl = 'https://www.youtube.com/watch?v=ueNHSL0dIVw';
    console.log(`测试视频: ${testVideoUrl}`);
    
    try {
        console.log('\n1. 测试单个视频字幕提取...');
        const result = await subtitleService.downloadSubtitle(testVideoUrl);
        
        console.log('✅ 字幕提取成功!');
        console.log(`视频ID: ${result.videoId}`);
        console.log(`提取方式: ${result.method}`);
        console.log(`字幕长度: ${result.subtitleText.length} 字符`);
        console.log(`提取时间: ${result.extractedAt}`);
        console.log(`字幕预览: ${result.subtitleText.substring(0, 200)}...`);
        
    } catch (error) {
        console.error('❌ 单个视频字幕提取失败:', error.message);
    }
    
    // 测试频道批量提取
    const channelUrl = 'https://www.youtube.com/@GarethSolowayProTrader/videos';
    console.log(`\n\n2. 测试频道批量字幕提取...`);
    console.log(`频道: ${channelUrl}`);
    
    try {
        console.log('获取频道最新3个视频的字幕...');
        const batchResults = await subtitleService.batchDownloadChannelSubtitles(channelUrl, 3);
        
        console.log(`\n✅ 批量提取完成! 处理了 ${batchResults.length} 个视频`);
        
        batchResults.forEach((result, index) => {
            console.log(`\n--- 视频 ${index + 1} ---`);
            console.log(`标题: ${result.title || 'Unknown'}`);
            console.log(`视频ID: ${result.videoId}`);
            
            if (result.error) {
                console.log(`❌ 错误: ${result.error}`);
            } else {
                console.log(`✅ 成功提取`);
                console.log(`字幕长度: ${result.subtitleText?.length || 0} 字符`);
                console.log(`提取方式: ${result.method}`);
                if (result.subtitleText) {
                    console.log(`预览: ${result.subtitleText.substring(0, 150)}...`);
                }
            }
        });
        
    } catch (error) {
        console.error('❌ 批量字幕提取失败:', error.message);
    }
    
    // 显示已保存的字幕文件
    console.log('\n\n3. 已保存的字幕文件:');
    const savedFiles = subtitleService.getSubtitleFiles();
    
    if (savedFiles.length === 0) {
        console.log('暂无已保存的字幕文件');
    } else {
        savedFiles.forEach((file, index) => {
            console.log(`\n${index + 1}. ${file.fileName}`);
            console.log(`   视频ID: ${file.videoId}`);
            console.log(`   文件大小: ${(file.size / 1024).toFixed(2)} KB`);
            console.log(`   文本长度: ${file.textLength} 字符`);
            console.log(`   创建时间: ${new Date(file.createdAt).toLocaleString()}`);
        });
    }
    
    console.log('\n=== 测试完成 ===');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    testSubtitleExtraction().catch(console.error);
}

export default testSubtitleExtraction;