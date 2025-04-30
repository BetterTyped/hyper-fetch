import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-ignore
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

import { config } from "./vite.base.config";

// https://vitejs.dev/config
export default defineConfig((props) => {
  const options = config(props);
  return {
    ...options,
    plugins: [...(options.plugins || []), react(), tailwindcss(), svgr()],
  };
});
