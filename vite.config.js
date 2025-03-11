/*
 * @Author: liqifeng
 * @Date: 2025-03-11 11:00:44
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-11 17:47:10
 * @Description:
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import path from "path";
const resolve = (dir) => path.join(__dirname, dir);
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue"], // 自动导入 Vue 的 Composition API
      // dts: 'src/auto-imports.d.ts', // 生成类型声明文件
    }),
  ],

  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true, // 启用 Less 的 JavaScript 支持
      },
    },
  },
  base: "/", //打包相对路径
  resolve: {
    // 配置别名
    alias: {
      "@": resolve("src"),
    },
  },
});
