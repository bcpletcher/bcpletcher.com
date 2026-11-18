import { mergeConfig } from "vite";
import base from "./vite.config.dev.mjs";
export default mergeConfig(base, { server: { port: 5199, proxy: { "/api": { target: "https://www.bcpletcher.com", changeOrigin: true, secure: true } } } });
