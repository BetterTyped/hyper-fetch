import * as fs from "fs";

const initializeRealtimeDB = async () => {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = "localhost:9000";
  process.env.FIREBASE_DATABASE_AUTH_EMULATOR_HOST = "localhost:9000";
  // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
  const admin = require("@firebase/rules-unit-testing");
  const testEnv = await admin.initializeTestEnvironment({
    projectId: "demo-test",
    database: {
      rules: fs.readFileSync("database.rules.json", "utf-8"),
    },
  });
  const db = testEnv.authenticatedContext("db").database();

  return db;
};

export const realtimeDBAdmin = initializeRealtimeDB();
