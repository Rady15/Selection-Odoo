/// <reference types="vite/client" />

interface ImportMetaEnv {
 readonly VITE_GOOGLE_CLIENT_ID?: string;
 readonly NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
 readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
 readonly env: ImportMetaEnv;
}
