// Global type declarations

declare global {
  interface Window {
    __VARS__?: {
      serverData?: {
        appVersion?: string;
        supabase?: {
          url?: string;
          publishableKey?: string;
        };
      };
    };
  }

  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export { };
