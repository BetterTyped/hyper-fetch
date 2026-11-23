import { defineConfig } from "vite";

import { config } from "./vite.base.config";

// https://vitejs.dev/config
export default defineConfig((env) => config(env, { target: "electron" }));
