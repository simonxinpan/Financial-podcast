# 📊 财报播客自动化生成器

> 为北美华人投资者提供自动化的标普500财报电话会议中文播客服务

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Enabled-brightgreen)](https://github.com/features/actions)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎯 项目愿景

将标普500公司1小时的财报电话会议转化为5分钟的高质量中文播客，为北美华人投资者提供及时、专业、易懂的财报解读服务。

## ✨ 核心特性

### 🚀 P0 功能 (MVP)
- ✅ **手动触发工作流**: 通过GitHub Actions手动输入股票代码、年份、季度
- ✅ **自动获取文字稿**: 集成Finnhub API获取英文财报电话会议文字稿
- ✅ **AI智能摘要**: 使用Google Gemini生成结构化中文摘要
- ✅ **语音播客生成**: 通过Coze TTS API生成高质量中文播客MP3
- ✅ **数据持久化**: 自动将结果存储到PostgreSQL数据库

### 🔄 P1 功能 (规划中)
- 📅 **财报日历联动**: 与财报发布日历API集成，实现半自动化触发
- 📱 **历史记录查询**: 在Web界面展示公司历史财报解读
- 🔍 **搜索和筛选**: 按公司、时间、行业等维度搜索播客

### 🌟 P2 功能 (未来)
- 🤖 **全自动化流程**: 无人值守的财报季内容生产
- 🎵 **音效增强**: 添加背景音乐、转场音效
- 📊 **数据可视化**: 财报关键指标图表展示

## 🏗️ 技术架构

```
财报播客生成器
├── 🔄 GitHub Actions (工作流编排)
├── 📊 Finnhub API (财报文字稿)
├── 🤖 Google Gemini (AI摘要生成)
├── 🎙️ Coze TTS (语音合成)
├── 🗄️ Neon PostgreSQL (数据存储)
└── ☁️ Vercel Blob (音频文件存储)
```

## 📁 项目结构

```
financial-podcast-generator/
├── .github/
│   └── workflows/
│       └── generate-report.yml     # GitHub Actions工作流
├── _scripts/
│   └── generate-report.mjs         # 主执行脚本
├── src/
│   ├── services/                   # 第三方API服务
│   │   ├── finnhub.js             # Finnhub API封装
│   │   ├── gemini.js              # Google Gemini API封装
│   │   └── coze.js                # Coze TTS API封装
│   ├── utils/                     # 工具函数
│   │   ├── database.js            # 数据库操作
│   │   └── logger.js              # 日志记录
│   └── templates/                 # AI Prompt模板
│       ├── summary_prompt_zh.txt  # 中文摘要模板
│       └── summary_prompt_en.txt  # 英文摘要模板
├── .env.example                   # 环境变量示例
├── .gitignore                     # Git忽略文件
├── package.json                   # 项目配置
├── PRD.md                         # 产品需求文档
└── README.md                      # 项目说明文档
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/your-username/financial-podcast-generator.git
cd financial-podcast-generator

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env
```

### 2. 配置API密钥

编辑 `.env` 文件，填入以下API密钥：

```env
# 数据库连接
DATABASE_URL=postgresql://username:password@host:port/database

# API密钥
FINNHUB_API_KEY=your_finnhub_api_key
GEMINI_API_KEY=your_gemini_api_key
COZE_API_KEY=your_coze_api_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 3. 本地运行

```bash
# 运行播客生成脚本
node _scripts/generate-report.mjs --ticker=AAPL --year=2024 --quarter=Q3 --language=zh-CN
```

### 4. GitHub Actions配置

在GitHub Repository Settings > Secrets中添加以下环境变量：
- `DATABASE_URL`
- `FINNHUB_API_KEY`
- `GEMINI_API_KEY`
- `COZE_API_KEY`
- `BLOB_READ_WRITE_TOKEN`

## 📖 使用指南

### GitHub Actions手动触发

1. 进入GitHub仓库的 **Actions** 标签页
2. 选择 **Generate Financial Podcast** 工作流
3. 点击 **Run workflow** 按钮
4. 填入参数：
   - **Stock Ticker**: 股票代码 (如: AAPL, MSFT, GOOGL)
   - **Year**: 年份 (如: 2024)
   - **Quarter**: 季度 (如: Q1, Q2, Q3, Q4)
   - **Language**: 语言 (zh-CN 或 en-US)
5. 点击 **Run workflow** 开始执行

### 命令行使用

```bash
# 基本用法
node _scripts/generate-report.mjs --ticker=AAPL --year=2024 --quarter=Q3

# 指定语言
node _scripts/generate-report.mjs --ticker=MSFT --year=2024 --quarter=Q2 --language=en-US

# 启用调试模式
DEBUG_MODE=true node _scripts/generate-report.mjs --ticker=GOOGL --year=2024 --quarter=Q1
```

## 🔧 API配置指南

### Finnhub API
1. 访问 [Finnhub.io](https://finnhub.io/dashboard)
2. 注册账户并获取免费API密钥
3. 免费版限制：60次调用/分钟

### Google Gemini API
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建API密钥
3. 推荐模型：`gemini-1.5-flash`

### Coze TTS API
1. 访问 [Coze平台](https://www.coze.com/)
2. 创建TTS机器人并获取API密钥
3. 配置中文语音合成参数

### Neon PostgreSQL
1. 访问 [Neon.tech](https://neon.tech/)
2. 创建免费数据库实例
3. 获取连接字符串

### Vercel Blob Storage
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 创建Blob存储并获取访问令牌
3. 用于存储生成的音频文件

## 📊 数据库结构

```sql
CREATE TABLE earnings_reports (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    quarter VARCHAR(2) NOT NULL,
    language VARCHAR(5) NOT NULL DEFAULT 'zh-CN',
    transcript_url TEXT,
    summary_text TEXT,
    audio_url TEXT,
    audio_duration INTEGER,
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, year, quarter, language)
);
```

## 🔍 监控和日志

### 日志级别
- `debug`: 详细调试信息
- `info`: 一般信息记录
- `warn`: 警告信息
- `error`: 错误信息

### 日志文件
- 控制台输出：实时查看执行状态
- 文件输出：`./logs/app.log`
- GitHub Actions：在工作流运行日志中查看

## 🌐 静态页面部署

### Vercel部署

本项目包含一个静态页面原型，可以快速部署到Vercel平台进行预览和演示。

**快速部署步骤：**

1. **安装Vercel CLI**
   ```bash
   npm run vercel:install
   ```

2. **登录Vercel**
   ```bash
   npm run vercel:login
   ```

3. **部署到预览环境**
   ```bash
   npm run deploy
   ```

4. **部署到生产环境**
   ```bash
   npm run deploy:prod
   ```

**本地预览：**
```bash
npm run preview
# 访问 http://localhost:3000
```

**详细部署指南：** 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 获取完整的部署文档。

### 页面特性

- 📱 **响应式设计**：完美适配手机、平板、桌面端
- 🎨 **现代UI**：采用渐变背景和卡片式设计
- 🔍 **智能搜索**：支持股票代码、年份、季度筛选
- 🎵 **播客播放**：内置音频播放器和控制功能
- 💾 **历史记录**：展示历史播客和收藏功能
- 🌟 **用户体验**：流畅的交互动画和状态反馈

## 🚨 故障排除

### 常见问题

**Q: API调用失败**
- 检查API密钥是否正确配置
- 确认API配额是否充足
- 查看网络连接是否正常

**Q: 数据库连接失败**
- 验证DATABASE_URL格式是否正确
- 确认数据库服务是否可访问
- 检查SSL连接配置

**Q: 音频生成失败**
- 确认Coze TTS API配置
- 检查文本内容是否符合TTS要求
- 验证音频存储服务配置

**Q: GitHub Actions执行失败**
- 检查Repository Secrets配置
- 查看工作流日志详细错误信息
- 确认所有依赖项正确安装

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Finnhub](https://finnhub.io/) - 提供财报数据API
- [Google Gemini](https://ai.google.dev/) - AI摘要生成
- [Coze](https://www.coze.com/) - 语音合成服务
- [Neon](https://neon.tech/) - PostgreSQL数据库服务
- [Vercel](https://vercel.com/) - 文件存储服务

## 📞 联系方式

- 项目维护者: PM-Core
- 问题反馈: [GitHub Issues](https://github.com/your-username/financial-podcast-generator/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-username/financial-podcast-generator/discussions)

---

**免责声明**: 本项目生成的内容仅供参考，不构成投资建议。投资有风险，决策需谨慎。