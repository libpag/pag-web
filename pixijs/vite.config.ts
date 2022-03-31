import { defineConfig } from "vite";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    copy({
      targets: [
        {
          src: "./node_modules/libpag/lib/libpag.wasm",
          dest: process.env.NODE_ENV === "production" ? "dist/" : "public/",
        },
      ],
      hook:
        process.env.NODE_ENV === "production" ? "writeBundle" : "buildStart",
    }),
  ],
  base: "./",
});
