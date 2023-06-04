import { initializeApp, setLogLevel } from "firebase/app";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";

const initializeRealtimeDB = () => {
  const app = initializeApp(
    {
      projectId: "demo-test",
    },
    Date.now().toString(),
  );

  const db = getDatabase(app);
  connectDatabaseEmulator(db, "127.0.0.1", 9000);

  setLogLevel("debug");

  return db;
};

export const realtimeDBBrowser = initializeRealtimeDB();
