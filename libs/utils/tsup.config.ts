// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // 如果有多个入口可以都写，支持 glob
  format: ["cjs", "esm"], // 同时输出 CommonJS 和 ESModule
  target: "es2020", // 或者 'esnext' / 'node18'
  platform: "neutral", // 同时兼容 node 和 browser
  dts: true, // 自动生成 .d.ts 声明文件
  sourcemap: true, // 生成 sourcemap
  clean: true, // 构建前清空 dist
  splitting: true, // 代码分割（对 esm 更友好
  treeshake: true, // 去除未使用的代码
  minify: false, // 通常发库不压缩，交给下游打包工具
  shims: true, // 自动补 __dirname、__filename 等 Node 内置变量（对 cjs 很有用

  // 可选：如果你想让 .mjs 后缀而不是 .js（更规范）
  // esmExtension: 'mjs',

  // 可选：banner 让 cjs 也能用 import 语法（对某些老工具友好）
  banner: {
    js: `'use client';`, // 如果是 React 组件库可以加这个，或者留空
    // js: "import { createRequire as __createRequire } from 'module';const require = __createRequire(import.meta.url);",
  },

  // 可选：外部依赖（推荐全部 external，体积最小）
  external: [], // 通常留空，让 tsup 自动识别 package.json 的 dependencies
});
