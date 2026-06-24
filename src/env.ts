import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DEEPSEEK_API_KEY: z.string().trim().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development")
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}

export const env = loadEnv();
