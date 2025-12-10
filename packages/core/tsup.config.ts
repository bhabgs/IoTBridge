import { defineConfig } from "tsup";

// 检查是否只构建类型
const typesOnly = process.env.BUILD_TYPES_ONLY === "true";

export default defineConfig({
  entry: typesOnly ? ["src/index-core.ts"] : ["src/index.ts"],
  format: ["esm"],
  dts: {
    compilerOptions: {
      skipLibCheck: true,
      moduleResolution: "bundler",
    },
  },
  external: ["three", /three\/examples\/.*/],
  clean: !typesOnly, // 类型构建时不清理，避免覆盖
  sourcemap: true,
  minify: false,
  target: "es2020",
  esbuildOptions(options) {
    options.drop = []; // 保留 console.log
  },
  outDir: "dist",
});
