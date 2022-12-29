import { client } from "api/client";

export const postFile = client
  .createRequest<{ response: string }, { file: File }>()({
    endpoint: "/api/files",
    method: "POST",
    queued: true,
    retry: 0,
  })
  .setDataMapper<FormData>((data: any) => {
    try {
      const formData = new FormData();
      formData.append("file", data.file);
      return formData;
    } catch (err) {
      return data;
    }
  });
