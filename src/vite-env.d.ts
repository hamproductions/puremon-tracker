/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ENV__BASE_URL: string;
  readonly PUBLIC_ENV__APP_VERSION: string;
  readonly PUBLIC_ENV__BUILD_TIMESTAMP: string;
  readonly PUBLIC_ENV__SUPABASE_URL?: string;
  readonly PUBLIC_ENV__SUPABASE_ANON_KEY?: string;
  readonly PUBLIC_ENV__ADMIN_HANDLES?: string;
  readonly PUBLIC_ENV__ENABLE_E2E_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
