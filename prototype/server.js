import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
    // 解析URL，移除查询参数
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;
    
    // 处理根路径
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // 构建文件路径
    let filePath = path.join(__dirname, pathname);
    
    // 获取文件扩展名
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    // 设置正确的Content-Type
    switch (extname) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.gif':
            contentType = 'image/gif';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        default:
            contentType = 'text/html';
    }
    
    // 添加调试日志
    console.log(`请求: ${req.url} -> 文件路径: ${filePath}`);
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log(`文件未找到: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <h1>页面未找到 (404)</h1>
                    <p>请求的文件: ${pathname}</p>
                    <p>文件路径: ${filePath}</p>
                    <p><a href="/">返回首页</a></p>
                    <p><a href="/market-report.html">查看市场报告</a></p>
                `);
            } else {
                console.log(`服务器错误: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('服务器内部错误');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});