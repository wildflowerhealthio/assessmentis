import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  envPrefix: "PUBLIC_",
  optimizeDeps: {},
  server: {
    proxy: {
      "/api/dailyco": {
        target: "https://assessment-is-sandbox.firebaseapp.com",
        changeOrigin: true,
      },
      "/__/auth": {
        target: "https://assessment-is-sandbox.firebaseapp.com",
        changeOrigin: true,
      },
    },
  },
});
