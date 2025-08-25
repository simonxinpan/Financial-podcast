# 📦 Vercel部署指南

本指南将帮助您将财报播客静态页面原型部署到Vercel平台。

## 🚀 快速部署

### 1. 环境准备

**安装Vercel CLI**
```bash
# 使用npm脚本安装
npm run vercel:install

# 或直接安装
npm install -g vercel
```

**登录Vercel账户**
```bash
# 使用npm脚本登录
npm run vercel:login

# 或直接登录
vercel login
```

### 2. 部署到预览环境

```bash
# 使用npm脚本部署
npm run deploy

# 或直接使用部署脚本
node deploy.js
```

### 3. 部署到生产环境

```bash
# 使用npm脚本部署到生产
npm run deploy:prod

# 或直接使用部署脚本
node deploy.js --prod
```

## 📋 部署配置详解

### vercel.json配置文件

```json
{
  "version": 2,
  "name": "financial-podcast-prototype",
  "builds": [
    {
      "src": "prototype/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/prototype/index.html"
    },
    {
      "src": "/prototype/(.*)",
      "dest": "/prototype/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/prototype/$1"
    }
  ]
}
```

**配置说明：**
- `builds`: 指定构建静态文件的规则
- `routes`: 配置URL路由，将根路径指向原型页面
- `headers`: 设置缓存策略，优化加载性能

### 项目结构

```
Financial-Podcast/
├── prototype/
│   ├── index.html          # 主页面
│   └── server.js           # 本地预览服务器
├── vercel.json             # Vercel配置文件
├── deploy.js               # 部署脚本
└── package.json            # 项目配置
```

## 🛠️ 部署脚本功能

### deploy.js脚本特性

- **前置条件检查**: 自动验证必要文件是否存在
- **CLI检查**: 确保Vercel CLI已正确安装
- **智能部署**: 支持预览和生产环境部署
- **错误处理**: 提供详细的错误信息和解决建议
- **使用指南**: 内置帮助文档

### 可用命令

```bash
# 查看帮助信息
node deploy.js --help

# 本地预览
npm run preview

# 部署到预览环境
npm run deploy

# 部署到生产环境
npm run deploy:prod
```

## 🔧 首次部署步骤

### 1. 准备工作

1. **确保文件完整**
   - `prototype/index.html` 存在
   - `vercel.json` 配置正确
   - `deploy.js` 脚本可执行

2. **安装依赖**
   ```bash
   npm install
   ```

### 2. 配置Vercel

1. **注册Vercel账户**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub/GitLab/Bitbucket账户注册

2. **安装并登录CLI**
   ```bash
   npm run vercel:install
   npm run vercel:login
   ```

### 3. 执行部署

1. **首次部署**
   ```bash
   npm run deploy
   ```
   
   首次部署时，Vercel会询问：
   - 项目名称（建议：financial-podcast-prototype）
   - 项目目录（选择当前目录）
   - 是否链接到现有项目（选择No创建新项目）

2. **后续部署**
   ```bash
   # 预览部署
   npm run deploy
   
   # 生产部署
   npm run deploy:prod
   ```

## 🌐 部署后访问

### URL结构

- **预览环境**: `https://financial-podcast-prototype-xxx.vercel.app`
- **生产环境**: `https://financial-podcast-prototype.vercel.app`

### 页面路由

- **主页**: `/` → 重定向到原型页面
- **原型页面**: `/prototype/` → 静态页面原型
- **直接访问**: 所有路径都会正确路由到原型页面

## 🔍 故障排除

### 常见问题

**1. Vercel CLI未安装**
```bash
# 解决方案
npm install -g vercel
# 或使用脚本
npm run vercel:install
```

**2. 登录失败**
```bash
# 重新登录
vercel logout
vercel login
```

**3. 部署失败**
- 检查 `prototype/index.html` 是否存在
- 确认 `vercel.json` 配置正确
- 查看Vercel控制台的详细错误信息

**4. 页面无法访问**
- 确认路由配置正确
- 检查静态文件是否正确上传
- 查看浏览器开发者工具的网络请求

### 调试技巧

1. **本地预览**
   ```bash
   npm run preview
   # 访问 http://localhost:3000
   ```

2. **查看部署日志**
   - 访问Vercel控制台
   - 查看Functions和Deployments标签
   - 检查构建和运行时日志

3. **验证配置**
   ```bash
   # 检查vercel.json语法
   node -e "console.log(JSON.parse(require('fs').readFileSync('vercel.json', 'utf8')))"
   ```

## 📊 性能优化

### 缓存策略

- **静态资源**: 1年缓存（CSS、JS、图片）
- **HTML文件**: 不缓存，确保内容更新
- **API响应**: 根据数据更新频率设置

### 加载优化

- **资源压缩**: Vercel自动启用Gzip压缩
- **CDN分发**: 全球CDN节点加速访问
- **HTTP/2**: 自动启用HTTP/2协议

## 🔄 持续部署

### GitHub集成

1. **连接GitHub仓库**
   - 在Vercel控制台导入GitHub项目
   - 配置自动部署分支（通常是main/master）

2. **自动部署触发**
   - 推送到主分支自动部署到生产环境
   - 推送到其他分支自动部署到预览环境

### 环境变量

如果需要配置环境变量：
1. 在Vercel控制台的Settings → Environment Variables
2. 添加必要的环境变量
3. 重新部署项目

## 📞 支持与帮助

- **Vercel文档**: [vercel.com/docs](https://vercel.com/docs)
- **部署脚本帮助**: `node deploy.js --help`
- **项目问题**: 查看项目README.md

---

🎉 **恭喜！您的财报播客原型现已成功部署到Vercel平台！**