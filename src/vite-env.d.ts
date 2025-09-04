/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_CACHE_TTL: string
  readonly VITE_CACHE_ENABLED: string
  readonly VITE_AI_API_KEY: string
  readonly VITE_AI_MODEL: string
  readonly VITE_AI_BASE_URL: string
  readonly DEV: boolean
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}