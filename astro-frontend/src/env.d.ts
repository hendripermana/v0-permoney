/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_APP_NAME: string;
  readonly PUBLIC_APP_URL: string;
  readonly CF_PAGES: string;
  readonly CF_PAGES_URL: string;
  readonly NODE_ENV: string;
  readonly PUBLIC_VERCEL_ANALYTICS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
