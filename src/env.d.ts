/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCKET_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_COZE_KEY?: string
  readonly VITE_USE_SSL?: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
