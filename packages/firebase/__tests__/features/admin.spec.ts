import admin from "firebase-admin";

export const app = admin.initializeApp();
export const db = app.firestore();

describe("Works", () => {
  test("loads and returns data from server", async () => {
    const { id } = await admin.firestore().collection("messages").add({ original: "test" });
    const element = await admin.firestore().collection("messages").doc(id).get();

    expect(element.data()).toEqual({ original: "test" });
  });
});
