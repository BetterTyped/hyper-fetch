const initializeRealtimeDB = () => {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = "localhost:9000";
  process.env.FIREBASE_DATABASE_AUTH_EMULATOR_HOST = "localhost:9000";
  // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
  const admin = require("firebase-admin");
  const app = admin.initializeApp({
    projectId: "demo-test",
    databaseURL: "http://127.0.0.1:9000?ns=demo-test-default-rtdb",
  });
  const db = admin.database(app);

  return db;
};

export const realtimeDBAdmin = initializeRealtimeDB();
