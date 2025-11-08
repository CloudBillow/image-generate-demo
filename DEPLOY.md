# 部署指南

## 本地开发

现在可以直接使用 Vite 自带的代理，不再需要启动单独的代理服务器：

```bash
# 安装依赖
npm install

# 启动开发服务器（Vite 会自动代理 API 请求）
npm run dev
```

Vite 会自动将 `/api/*` 请求代理到 `https://ark.cn-beijing.volces.com/api/v3/*`

## 服务器部署

### 1. 构建项目

```bash
npm run build
```

构建后的文件会生成在 `dist` 目录。

### 2. 配置 Nginx

参考 `nginx.conf.example` 文件，配置您的 Nginx：

**关键配置点：**

- **静态文件托管**: 指向 `dist` 目录
- **SPA 路由支持**: `try_files $uri $uri/ /index.html`
- **API 反向代理**: `/api/*` 代理到火山引擎 API
- **SSE 流式支持**:
  - `proxy_buffering off`
  - `proxy_cache off`
  - `proxy_read_timeout 300s`

### 3. 部署步骤

```bash
# 1. 上传 dist 目录到服务器
scp -r dist/* user@your-server:/path/to/nginx/html/

# 2. 配置 Nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/your-app
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/

# 3. 测试配置
sudo nginx -t

# 4. 重启 Nginx
sudo systemctl restart nginx
```

## 架构说明

### 开发环境
```
浏览器 -> Vite Dev Server (端口 5173)
                ↓ 代理 /api/*
         火山引擎 API (https://ark.cn-beijing.volces.com)
```

### 生产环境
```
浏览器 -> Nginx (端口 80/443)
         ├─ 静态文件 (dist/)
         └─ API 代理 /api/* -> 火山引擎 API
```

## 优势

- ✅ **简化开发**: 不需要启动额外的 proxy-server.js
- ✅ **简化部署**: 只需要 Nginx，无需 Node.js 运行时
- ✅ **更好的性能**: Nginx 处理静态文件和反向代理比 Node.js 更高效
- ✅ **统一端口**: 前端和 API 使用同一域名/端口，避免 CORS 问题

## 移除的文件

现在可以安全删除以下文件（如果不再需要）：
- `proxy-server.js` - 不再需要 Node.js 代理服务器

## 注意事项

1. **API Key 安全**: Authorization header 会通过 Nginx 代理传递到火山引擎 API
2. **SSL/HTTPS**: 生产环境建议配置 SSL 证书（使用 Let's Encrypt）
3. **域名配置**: 修改 `nginx.conf.example` 中的 `server_name`
4. **路径配置**: 修改 `root` 指向实际的 dist 目录路径
