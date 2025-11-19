# GEMINI.md: 项目上下文

本文档提供了 `image-generate-demo` 项目的重要上下文信息，旨在帮助 AI 助手理解和修改代码库。

## 项目概述

这是一个 Vue.js 3 Web 应用程序，作为图像生成服务的前端界面。它使用 Vite 构建，并使用 Element Plus 组件库作为其 UI。

该应用程序允许用户：
- 选择不同的图像生成模式（例如，文本生成图像）。
- 配置各种生成参数。
- 向后端 API 提交请求以生成图像。
- 查看结果，包括生成的图像、使用统计信息和潜在错误。
- 取消正在进行的生成请求。

核心逻辑封装在 `src/views/ImageGeneration.vue` 组件中，该组件管理状态和用户交互。API 通信由 `src/services/seedreamApi.js` 处理，该服务支持标准和流式（服务器发送事件）响应。

## 关键技术

- **框架**: Vue.js 3
- **构建工具**: Vite
- **UI 库**: Element Plus
- **语言**: JavaScript
- **API 通信**: `fetch` API

## 构建和运行项目

### 1. 安装依赖

请确保您已安装 Node.js（`package.json` 中指定了版本）。

```bash
npm install
```

### 2. 运行开发服务器

此命令启动一个本地开发服务器，并启用热重载。应用程序将可通过 `http://localhost:5173` 访问（如果 5173 端口已被占用，则会使用其他端口）。

```bash
npm run dev
```

开发服务器在 `vite.config.js` 中配置，将来自 `/api` 的 API 请求代理到生产环境的端点 `https://ark.cn-beijing.volces.com/api/v3`，以避免 CORS 问题。

### 3. 构建生产版本

此命令打包应用程序以用于生产环境。输出将放置在 `dist` 目录中。

```bash
npm build
```

### 4. 预览生产版本

此命令启动一个本地服务器，用于从 `dist` 目录预览生产版本。

```bash
npm preview
```

## 开发约定

- **组件结构**: 项目遵循标准的 Vue 单文件组件结构。全局组件位于 `src/components`，视图级组件位于 `src/views`。
- **API 服务层**: API 调用集中在 `src/services/seedreamApi.js` 中。此服务负责处理 `fetch` 请求、处理响应（包括流式响应）以及格式化错误。
- **状态管理**: 组件级状态使用 Vue 的组合式 API (`ref`, `reactive`) 进行管理。
- **样式**: 全局样式在 `src/assets/main.css` 中定义。组件特定样式与组件文件一起位于 `<style scoped>` 中。
- **API 密钥**: 图像生成服务的 API 密钥预计由用户通过 UI 提供，并通过 `Authorization` 头传递到 API 请求中。