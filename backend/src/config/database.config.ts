import { registerAs } from '@nestjs/config';
import { resolveDatabaseEnv } from './database.utils';

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  maxConnections: number;
  connectionTimeout: number;
  ssl: boolean;
}

export default registerAs('database', (): DatabaseConfig => {
  const resolved = resolveDatabaseEnv();

  return {
    url: resolved.url,
    host: resolved.host,
    port: resolved.port,
    username: resolved.username,
    password: resolved.password,
    database: resolved.database,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
    ssl: resolved.ssl,
  };
});
