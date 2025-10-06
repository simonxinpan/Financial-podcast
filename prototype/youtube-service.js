// YouTube数据服务 - 获取Gareth Soloway频道视频信息
class YouTubeService {
    constructor() {
        this.channelId = '@GarethSolowayProTrader';
        this.baseUrl = 'https://www.youtube.com';
        this.mockData = this.generateMockData(); // 模拟数据，实际应用中需要YouTube API
    }

    // 生成模拟数据（基于搜索结果）
    generateMockData() {
        const videos = [
            {
                id: 'video1',
                title: 'Major Levels, Targets And Forecasts Revealed For Gold, Silver, Platinum And Palladium',
                publishedAt: new Date(Date.now() - 19 * 60 * 60 * 1000), // 19小时前
                views: '2.8万',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                description: '深度分析贵金属市场走势，揭示黄金、白银、铂金和钯金的关键价位和目标位',
                tags: ['贵金属', '黄金', '白银', '技术分析']
            },
            {
                id: 'video2',
                title: 'Big Breakout Levels Revealed: Technical Analysis On Ethereum (ETH), XRP, Solana (SOL), Cardano (ADA)',
                publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
                views: '2.6万',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                description: '加密货币技术分析：以太坊、瑞波币、Solana和卡尔达诺的重要突破位分析',
                tags: ['加密货币', '以太坊', 'XRP', 'Solana', '技术分析']
            },
            {
                id: 'video3',
                title: 'Alert: S&P 500 Topping Tail Confirmed, Tags A Major Trendline And Parallel Channel',
                publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
                views: '2.7万',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                description: 'S&P 500指数技术分析警报：顶部尾部确认，触及重要趋势线和平行通道',
                tags: ['S&P 500', '股市', '技术分析', '趋势线']
            },
            {
                id: 'video4',
                title: 'Bitcoin Breaking To New All-Time Highs? Ethereum Hammering A Major Level, Solana and XRP Analysis',
                publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
                views: '2.9万',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                description: '比特币是否将突破历史新高？以太坊冲击重要关口，Solana和XRP深度分析',
                tags: ['比特币', '以太坊', '加密货币', '历史新高']
            },
            {
                id: 'video5',
                title: 'Technical Analysis And Epic Forecasting: Natural Gas Surges, Oil Breaks Down',
                publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
                views: '1.5万',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                description: '能源市场技术分析：天然气飙升，原油价格下跌的深度预测分析',
                tags: ['天然气', '原油', '能源', '大宗商品']
            }
        ];

        return videos;
    }

    // 获取最新视频列表
    async getLatestVideos(limit = 10) {
        try {
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 按时间排序（最新的在前）
            const sortedVideos = this.mockData.sort((a, b) => 
                new Date(b.publishedAt) - new Date(a.publishedAt)
            );

            return sortedVideos.slice(0, limit);
        } catch (error) {
            console.error('获取视频列表失败:', error);
            return [];
        }
    }

    // 格式化发布时间
    formatPublishTime(publishedAt) {
        const now = new Date();
        const diff = now - new Date(publishedAt);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 24) {
            return `${hours}小时前`;
        } else if (days < 7) {
            return `${days}天前`;
        } else {
            const weeks = Math.floor(days / 7);
            return `${weeks}周前`;
        }
    }

    // 生成播客版本链接
    generatePodcastUrl(videoId) {
        // 模拟音频文件URL（实际应用中这里应该是真实的音频文件地址）
        return `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`;
    }

    // 生成网页图文版链接
    generateWebReportUrl(videoId) {
        return `/market-report.html?video=${videoId}`;
    }

    // 获取视频详细信息
    async getVideoDetails(videoId) {
        const video = this.mockData.find(v => v.id === videoId);
        if (!video) return null;

        return {
            ...video,
            webReportUrl: this.generateWebReportUrl(videoId),
            podcastUrl: this.generatePodcastUrl(videoId),
            formattedTime: this.formatPublishTime(video.publishedAt)
        };
    }
}

// 导出服务实例
window.YouTubeService = new YouTubeService();