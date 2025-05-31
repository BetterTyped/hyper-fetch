import { client } from "../client";

export const postFile = client
  .createRequest<{ response: string; payload: { file: File } }>()({
    endpoint: "/api/files",
    method: "POST",
    queued: true,
    retry: 0,
  })
  .setPayloadMapper((data) => {
    const formData = new FormData();
    formData.append("file", data.file);
    return formData;
  });
