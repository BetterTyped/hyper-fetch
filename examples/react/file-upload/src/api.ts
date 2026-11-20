import { createClient } from "@hyper-fetch/core";

/** httpbin echoes everything it receives, including the uploaded file. */
export const client = createClient({ url: "https://httpbin.org" });

type EchoResponse = {
  files: Record<string, string>;
  form: Record<string, string>;
  headers: Record<string, string>;
};

/** A `FormData` payload is sent as is: the browser sets the multipart `Content-Type` with its boundary. */
export const uploadFileRequest = client.createRequest<{
  response: EchoResponse;
  payload: FormData;
}>()({
  endpoint: "/post",
  method: "POST",
});
