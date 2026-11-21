import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const env = import.meta.env;
const emulatorHost = env.VITE_FIREBASE_EMULATOR_HOST;

const required = {
  VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID,
  // The emulator needs no keys, a real project needs the full web app config.
  ...(emulatorHost
    ? {}
    : {
        VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID,
      }),
};

/** Env variables that still have to be set. The app shows a setup screen until this is empty. */
export const missingEnv = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const firebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  // A placeholder keeps the module loadable without config. Nothing is sent until the setup is complete.
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "not-configured",
  appId: env.VITE_FIREBASE_APP_ID,
});

export const firestore = getFirestore(firebaseApp);

if (emulatorHost) {
  const [host, port] = emulatorHost.split(":");
  connectFirestoreEmulator(firestore, host, Number(port));
}
