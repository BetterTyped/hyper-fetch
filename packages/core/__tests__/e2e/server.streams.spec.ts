/**
 * @jest-environment node
 */
// TODO - zapisywanie do pliku z całego data - obsługa różnych responseTypes na backendzie
// TODO - typy serwerowego adaptera muszą być inne - ?? Nie wiadomo
// TODO - streamy - przekazywać stream
// TODO - poprawić dokumentację

// TODO Obsługa Http.Agent + Proxy
// TODO obsługa RedisCache
// TODO cacheKey dynamiczna funkcja - zastanowić się czy ma to sens

// TODO Router - Dokumentacja
// TODO Investigate - cacheFalse
// TODO Mini paczucha - HF vcr

/*
* // `responseType` indicates the type of data that the server will respond with
  // options are: 'arraybuffer', 'document', 'json', 'text', 'stream'
  //   browser only: 'blob'
  responseType: 'json', // default
*
* */

import * as fs from "fs";
import * as path from "path";

import { Client } from "client";

describe("Fetch Adapter [ Server ]", () => {
  let client = new Client({ url: "https://lh3.googleusercontent.com" });
  let request = client.createRequest<any>()({
    endpoint:
      "/iXmJ9aWblkGDpg-_jpcqaY10KmA8HthjZ7F15U7mJ9PQK6vZEStMlathz1FfQQWV5XeeF-A1tZ0UpDjx3q6vEm2BWZn5k1btVSuBk9ad=s660",
  });
  beforeEach(() => {
    client = new Client({ url: "https://lh3.googleusercontent.com" });
    request = client.createRequest<any>()({
      options: { responseType: "arraybuffer" },
      endpoint:
        "/iXmJ9aWblkGDpg-_jpcqaY10KmA8HthjZ7F15U7mJ9PQK6vZEStMlathz1FfQQWV5XeeF-A1tZ0UpDjx3q6vEm2BWZn5k1btVSuBk9ad=s660",
    });
  });
  it("should fetch data", async () => {
    const res = await request.setOptions({ responseType: "stream" }).send();
    // fs.writeFileSync(path.join(__dirname, "ada.jpg"), res.data);
    const f = fs.createWriteStream(path.join(__dirname, "ada.jpg"));
    res.data.pipe(f);
    // const req = https.get(
    //   "https://lh3.googleusercontent.com/iXmJ9aWblkGDpg-_jpcqaY10KmA8HthjZ7F15U7mJ9PQK6vZEStMlathz1FfQQWV5XeeF-A1tZ0UpDjx3q6vEm2BWZn5k1btVSuBk9ad=s660",
    //   (response) => {
    //     response.pipe(f);
    //     f.on("finish", () => {
    //       f.close();
    //     });
    //   },
    // );
    // let whole = "";
    // const req = https.request(
    //   "https://lh3.googleusercontent.com/iXmJ9aWblkGDpg-_jpcqaY10KmA8HthjZ7F15U7mJ9PQK6vZEStMlathz1FfQQWV5XeeF-A1tZ0UpDjx3q6vEm2BWZn5k1btVSuBk9ad=s660",
    //   { method: "GET" },
    //   (response) => {
    //     response.on("data", (chunk) => {
    //       console.log(">>>>>", typeof chunk);
    //       whole += chunk;
    //       f.write(chunk);
    //     });
    //     f.on("finish", () => {
    //       console.log("WHAT THE");
    // f.write(whole);
    // f.close();
    // });
    // },
    // );
    // req.end();
    // console.log("DID IT HAPPEN?", whole, "KURWA CO");
  });
});
