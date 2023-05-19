import { client } from "../client";

export const postFile = client
  .createRequest<{ response: string }, { file: File }>()({
    endpoint: "/api/files",
    method: "POST",
    queued: true,
    retry: 0,
  })
  .setDataMapper<FormData>((data: any) => {
    const formData = new FormData();
    formData.append("file", data.file);
    return formData;
  });
