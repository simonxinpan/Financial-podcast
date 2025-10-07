import SubtitleService from './subtitle-service.js';

async function testChannelExtraction() {
    console.log('=== 频道批量字幕提取测试 ===\n');
    
    const subtitleService = new SubtitleService();
    
    // 测试指定频道（限制提取数量以节省时间）
    const channelUrl = 'https://www.youtube.com/@GarethSolowayProTrader/videos';
    console.log(`测试频道: ${channelUrl}`);
    console.log('注意：为了测试，我们只提取前3个视频的字幕\n');
    
    try {
        console.log('开始批量提取频道字幕...');
        const results = await subtitleService.batchDownloadChannelSubtitles(channelUrl, 3); // 限制为3个视频
        
        // 分离成功和失败的结果
        const successful = results.filter(r => !r.error);
        const failed = results.filter(r => r.error);
        
        console.log('\n✅ 频道字幕批量提取成功!');
        console.log(`成功提取: ${successful.length} 个视频`);
        console.log(`提取失败: ${failed.length} 个视频`);
        console.log(`总计处理: ${results.length} 个视频`);
        
        if (successful.length > 0) {
            console.log('\n成功提取的视频:');
            successful.forEach((result, index) => {
                console.log(`${index + 1}. 视频ID: ${result.videoId}`);
                console.log(`   标题: ${result.title}`);
                console.log(`   字幕长度: ${result.subtitleText.length} 字符`);
                console.log(`   提取方式: ${result.method}`);
                console.log(`   提取时间: ${result.extractedAt}`);
                console.log(`   字幕预览: ${result.subtitleText.substring(0, 100)}...`);
                console.log('');
            });
        }
        
        if (failed.length > 0) {
            console.log('\n提取失败的视频:');
            failed.forEach((failure, index) => {
                console.log(`${index + 1}. 视频ID: ${failure.videoId}`);
                console.log(`   标题: ${failure.title}`);
                console.log(`   失败原因: ${failure.error}`);
                console.log('');
            });
        }
        
        // 返回格式化的结果
        return { successful, failed, total: results };
        
    } catch (error) {
        console.error('❌ 频道字幕批量提取失败:', error.message);
        throw error;
    }
}

// 直接运行测试
testChannelExtraction()
    .then(results => {
        console.log('\n=== 频道测试完成 ===');
        console.log(`最终统计: 成功 ${results.successful.length} 个，失败 ${results.failed.length} 个`);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n=== 频道测试失败 ===');
        console.error(error);
        process.exit(1);
    });