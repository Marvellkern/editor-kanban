import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { PRODUCT_NAME, TAGLINE, DOMAIN } from "./src/config";

// Injects the placeholders from src/config.ts into index.html at build time.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "inject-config",
      transformIndexHtml(html) {
        return html
          .replace(/%PRODUCT_NAME%/g, PRODUCT_NAME)
          .replace(/%TAGLINE%/g, TAGLINE)
          .replace(/%DOMAIN%/g, DOMAIN);
      },
    },
  ],
});
