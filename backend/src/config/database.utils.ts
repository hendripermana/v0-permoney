export interface ResolvedDatabaseEnv {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

const getOptionalNumber = (value: string | undefined, fallback: number): number => {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const resolveDatabaseEnv = (): ResolvedDatabaseEnv => {
  const host = process.env.DB_HOST ?? process.env.POSTGRES_HOST ?? 'localhost';
  const port = getOptionalNumber(process.env.DB_PORT ?? process.env.POSTGRES_PORT, 5432);
  const username = process.env.DB_USERNAME ?? process.env.POSTGRES_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? process.env.POSTGRES_PASSWORD ?? 'password';
  const database = process.env.DB_NAME ?? process.env.POSTGRES_DB ?? 'permoney';
  const sslFlag =
    process.env.DB_SSL === 'true' ||
    process.env.POSTGRES_SSL === 'true' ||
    /sslmode=require/i.test(process.env.DATABASE_URL ?? '');

  let url = process.env.DATABASE_URL;

  if (!url) {
    const encodedUser = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    const base = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
    url = sslFlag ? `${base}?sslmode=require` : base;
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }

  return {
    url,
    host,
    port,
    username,
    password,
    database,
    ssl: sslFlag,
  };
};
