import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/examples/adjusted-react-app",

  server: {
    port: 4200,
    host: "localhost",
  },

  preview: {
    port: 4300,
    host: "localhost",
  },

  plugins: [
    react(),
    nxViteTsPaths({
      debug: true,
    }),
    // viteTsConfigPaths({
    //   root: "../../",
    //   ignoreConfigErrors: true,
    // }),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
});
