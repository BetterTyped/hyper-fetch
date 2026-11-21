/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** `host:port` of the Firestore emulator. When set, only the project id is needed. */
  readonly VITE_FIREBASE_EMULATOR_HOST?: string;
}
