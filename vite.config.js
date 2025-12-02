import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    proxy: {
      // 火山引擎 (Volcengine)
      "/volcengine": {
        target: "https://ark.cn-beijing.volces.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/volcengine/, "/api/v3"),
      },

      // API易 (APIYi)
      "/proxy-apiyi": {
        target: "https://api.apiyi.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-apiyi/, ""),
      },

      // 柏拉图 (Plato)
      "/plato": {
        target: "https://api.bltcy.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/plato/, ""),
      },

      // 阿里百炼 (Alibaba Bailian/DashScope)
      "/bailian": {
        target: "https://dashscope.aliyuncs.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bailian/, ""),
      },
    },
  },
});
