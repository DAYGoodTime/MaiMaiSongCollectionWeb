import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
// import { visualizer } from "rollup-plugin-visualizer";
// cap not support gzip compressed file
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('md-'),
        },
      },
    }),
    // visualizer({
    //   open: true, // 在默认浏览器中自动打开报告
    //   gzipSize: true, // 显示 Gzip 压缩后的大小
    //   brotliSize: true, // 显示 Brotli 压缩后的大小
    //   filename: "stats.html", // 分析报告的文件名
    // }),
    // viteCompression({
    //   verbose: true,
    //   disable: false,
    //   threshold: 10240, // 只对大于 10kb 的文件进行压缩
    //   algorithm: "gzip",
    //   ext: ".gz",
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 11753,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将大的 JSON 文件单独打包
          if (id.includes("song_data_extra.json")) {
            return "song-data";
          }
          // 将 vue 全家桶和核心依赖打包到一起
          if (
            id.includes("node_modules") &&
            (id.includes("vue") ||
              id.includes("pinia") ||
              id.includes("vue-router"))
          ) {
            return "vendor-vue";
          }
          // 将 UI 库和图标库打包到一起
          if (
            id.includes("node_modules") &&
            (id.includes("lucide-vue-next") ||
              id.includes("radix-vue") ||
              id.includes("tailwind-variants"))
          ) {
            return "vendor-ui";
          }
          // 其他的 node_modules 单独打包
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  }
});
