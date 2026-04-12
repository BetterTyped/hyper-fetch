import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["specs/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
  },
});
