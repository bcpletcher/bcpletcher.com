import { resolve } from "path";

(async () => {
  if (process.env.NETLIFY !== "true") {
    // Only load .env files locally, not on Netlify
    const { config } = await import("dotenv");
    const environment = process.env.NODE_ENV || "development";
    const envFile = `.env.${environment}`;
    config({ path: resolve(process.cwd(), envFile) });
  }
})();
