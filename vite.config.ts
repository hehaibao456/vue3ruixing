import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";

export default defineConfig({
   base: "/vue3ruixing/", //改成你的仓库名
  plugins: [vue(), cesium()],
  server: { port: 5176, strictPort: true }
});
