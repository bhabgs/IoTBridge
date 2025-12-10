import { defineConfig } from "tsup";

// 检查是否只构建类型

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    resolve: true,
    compilerOptions: {
      skipLibCheck: true,
      moduleResolution: "bundler",
    },
  },
  clean: true, // 类型构建时不清理，避免覆盖
  sourcemap: true,
  minify: false,
  target: "es2020",
  outDir: "dist",
  // 不将渲染器包 externalize，因为它们现在是直接依赖
  external: ["pixi.js", "three"],
});
