import { resolve } from "path";

(async () => {
  const { config } = await import("dotenv");
  const environment = process.env.NODE_ENV || "development";
  const envFile = `.env.${environment}`;
  config({ path: resolve(process.cwd(), envFile) });
})();
