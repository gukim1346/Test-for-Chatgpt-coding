import 'dotenv/config';

type RequiredEnv = {
  PORT: number;
  APP_ORIGIN: string;
  JWT_SECRET: string;
  SESSION_TTL_SECONDS: number;
  DATABASE_URL: string;
  GCP_PROJECT_ID?: string;
  GCS_BUCKET?: string;
  GCS_SIGNED_URL_TTL_SECONDS: number;
  DEVICE_ID?: string;
  DEVICE_API_KEY?: string;
};

const number = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env: RequiredEnv = {
  PORT: number(process.env.PORT, 8080),
  APP_ORIGIN: process.env.APP_ORIGIN ?? 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET ?? 'changeme',
  SESSION_TTL_SECONDS: number(process.env.SESSION_TTL_SECONDS, 60 * 60 * 24 * 7),
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/doorbell',
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
  GCS_BUCKET: process.env.GCS_BUCKET,
  GCS_SIGNED_URL_TTL_SECONDS: number(process.env.GCS_SIGNED_URL_TTL_SECONDS, 3600),
  DEVICE_ID: process.env.DEVICE_ID,
  DEVICE_API_KEY: process.env.DEVICE_API_KEY,
};

export default env;
