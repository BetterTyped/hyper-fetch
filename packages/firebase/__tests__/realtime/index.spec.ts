import { initializeApp, setLogLevel } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { Client } from "@hyper-fetch/core";

import { firebaseAdapter } from "../../src/adapter/adapter.firebase";

export const sleep = async (ms: number) => {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((r) => setTimeout(r, ms));
};

const app = initializeApp({
  projectId: "demo-test",
});

const db = getDatabase(app);
connectDatabaseEmulator(db, "127.0.0.1", 9000);

setLogLevel("debug");

jest.setTimeout(10000);

describe("[Realtime Database]", () => {
  test("loads and returns data from server", async () => {
    const client = new Client({ url: "http://localhost/9000" }).setAdapter(() => firebaseAdapter(db));
    console.log("CREATING REQUEST");
    const req = client.createRequest()({
      endpoint: "users/1",
      method: "onValue",
    });
    console.log("SENDING...");
    const response = await req.send();
    console.log("RESPONSE", response);
    // const userRef = ref(db, "users/1");
    // await set(userRef, { username: "Kacper", email: "bt@bt.com" });
    // onValue(userRef, (snapshot) => {
    //   console.log(">>>>", snapshot.val());
    // });
    // await sleep(500);
  });
});
