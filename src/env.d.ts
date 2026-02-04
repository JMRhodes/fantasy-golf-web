/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GRAPHQL_ENDPOINT: string;
  readonly PUBLIC_BUCKET_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
