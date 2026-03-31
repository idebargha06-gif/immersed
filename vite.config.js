import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync } from "fs";

export default defineConfig({
  server: {
    port: 5173,
    host: "0.0.0.0"
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        privacy: resolve(__dirname, "privacy-policy.html"),
        terms: resolve(__dirname, "terms-of-service.html")
      }
    }
  }
});
