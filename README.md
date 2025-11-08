# Seedream 4.0 图像生成演示

基于火山引擎 ARK 平台的 Seedream 4.0 图像生成模型的多模式图像生成应用。

## 功能特性

✨ **四种生成模式**
- 🖼️ **文生单图** - 根据文本描述生成单张图片
- 🎨 **文生组图** - 批量生成多张图片（2-4张），支持流式输出
- 🔄 **图生图** - 基于参考图生成新图片
- 🎭 **多参考图生图** - 使用多张参考图（2-4张）生成图片

🚀 **核心能力**
- 流式输出：实时逐张展示生成结果
- 拖拽上传：支持拖拽或点击上传参考图
- 参数配置：支持尺寸、水印、输出张数等配置
- 结果管理：支持复制链接、下载、新窗口查看
- 暗色主题：基于设计规范的现代化 UI

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

由于 CORS 限制，需要同时启动代理服务器和前端开发服务器：

**方式一：分别启动（推荐，便于查看日志）**

终端 1 - 启动代理服务器：
```bash
npm run proxy
```

终端 2 - 启动前端：
```bash
npm run dev
```

**方式二：一键启动**
```bash
npm run dev:all
```

### 3. 访问应用

打开浏览器访问：`http://localhost:5173`

### 4. 配置 API Key

1. 在页面顶部的「API Key」输入框中输入您的火山引擎 ARK API Key
2. API Key 会自动保存在浏览器本地存储中，下次访问无需重新输入

## 使用指南

### 文生单图模式

1. 选择「文生单图」模式
2. 输入 API Key 和提示词
3. 配置图片尺寸和水印选项
4. 点击「生成图片」
5. 等待生成完成，查看结果

### 文生组图模式

1. 选择「文生组图」模式
2. 输入 API Key 和提示词
3. 设置输出张数（2-4张）
4. 开启「流式输出」可实时查看每张图片生成
5. 点击「生成图片」

### 图生图模式

1. 选择「图生图」模式
2. 上传 1 张参考图（点击或拖拽）
3. 输入提示词描述希望的变化
4. 配置参数后点击「生成图片」

### 多参考图生图模式

1. 选择「多参考图生图」模式
2. 上传 2-4 张参考图
3. 输入提示词
4. 设置输出张数和其他参数
5. 开启流式输出可逐张查看生成结果

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **后端代理**：Express + Node.js
- **样式**：CSS Variables (Design Tokens)
- **API**：火山引擎 ARK - Seedream 4.0

## 项目结构

```
image-generate-demo/
├── src/
│   ├── assets/
│   │   └── main.css              # 全局样式和设计令牌
│   ├── components/
│   │   ├── ModeSwitcher.vue      # 模式切换组件
│   │   ├── ParameterForm.vue     # 参数表单组件
│   │   ├── ImageUpload.vue       # 图片上传组件
│   │   └── ResultPanel.vue       # 结果展示组件
│   ├── services/
│   │   └── seedreamApi.js        # API 服务封装
│   ├── views/
│   │   └── ImageGeneration.vue   # 主页面
│   ├── App.vue
│   └── main.js
├── package.json
└── README.md
```

## API 参数说明

### 公共参数

- `model`: 固定为 `doubao-seedream-4-0-250828`
- `prompt`: 提示词（必填）
- `size`: 图片尺寸（512x512 | 1024x1024 | 1536x1536 | 2K | 4K）
- `watermark`: 是否添加水印（布尔值）
- `response_format`: 固定为 `url`

### 模式特定参数

**文生单图**
- `sequential_image_generation`: "disabled"
- `stream`: false

**文生组图**
- `sequential_image_generation`: "auto"
- `sequential_image_generation_options.max_images`: 2-4
- `stream`: true/false

**图生图**
- `image`: 单个图片 URL 或 Base64
- `sequential_image_generation`: "disabled"

**多参考图生图**
- `image`: 图片 URL 或 Base64 数组（2-4张）
- `sequential_image_generation`: "auto"
- `sequential_image_generation_options.max_images`: 2-4

## 常见问题

### 1. CORS 错误

**问题**：浏览器控制台提示 CORS 错误

**解决**：确保代理服务器已启动（`npm run proxy`），前端会通过 `http://localhost:3001` 代理请求到火山引擎 API

### 2. API Key 无效

**问题**：提示 401 错误

**解决**：
- 检查 API Key 是否正确
- 确认 API Key 有访问 Seedream 4.0 模型的权限
- 前往火山引擎控制台检查 API Key 状态

### 3. 图片无法显示

**问题**：生成成功但图片无法加载

**解决**：
- 检查网络连接
- 确认返回的图片 URL 是否可访问
- 查看浏览器控制台的错误信息

### 4. 上传图片失败

**问题**：参考图上传后提示错误

**解决**：
- 确保图片格式为 JPG 或 PNG
- 图片大小不超过 10MB
- 检查图片是否损坏

## 设计规范

本项目遵循 `UI设计规范.md` 中定义的设计令牌：

- 🎨 **色彩系统**：暗色主题为主，品牌色 #10A37F
- 📐 **间距系统**：4px 基础单位，8 档间距
- 🔘 **圆角规范**：容器 12px，按钮 10px
- ✨ **动效规范**：200ms 基础动效，贝塞尔曲线缓动
- 📝 **字体系统**：Inter 为主，JetBrains Mono 等宽字体

## 开发说明

### 本地开发

```bash
# 安装依赖
npm install

# 启动代理服务器
npm run proxy

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
npm run build
```

**注意**：生产环境需要配置后端代理或 CORS 策略，不能直接从浏览器调用火山引擎 API。

### 环境变量

可以通过环境变量配置代理服务器端口：

```bash
# .env.local
VITE_PROXY_PORT=3001
```

## 许可证

MIT License

## 相关资源

- [火山引擎 ARK 平台](https://www.volcengine.com/product/ark)
- [Seedream 4.0 API 文档](https://ark.cn-beijing.volces.com/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
