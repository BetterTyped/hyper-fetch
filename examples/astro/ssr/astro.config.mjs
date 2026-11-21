import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// The React integration renders islands on the server and hydrates them in the browser.
export default defineConfig({
  integrations: [react()],
});
