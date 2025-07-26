import { config } from "dotenv";
import { resolve } from "path";

const environment = process.env.NODE_ENV || "development";
const envFile = `.env.${environment}`;
config({ path: resolve(process.cwd(), envFile) });
