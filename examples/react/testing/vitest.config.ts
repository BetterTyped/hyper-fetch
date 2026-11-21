import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Testing Library needs a DOM. jsdom provides one in Node.
    environment: "jsdom",
  },
});
