/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAPIDAPI_HOST?: string;
  readonly VITE_RAPIDAPI_KEY?: string;
  readonly VITE_ADSTRA_AD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
