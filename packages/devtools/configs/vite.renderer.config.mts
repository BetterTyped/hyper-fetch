import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-ignore
import tailwindcss from "@tailwindcss/vite";

import { config } from "./vite.base.config";

config.plugins?.push(react());
config.plugins?.push(tailwindcss());

// https://vitejs.dev/config
export default defineConfig(config);
