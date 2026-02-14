import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/ParseTrainer/",
  publicDir: false,
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});
