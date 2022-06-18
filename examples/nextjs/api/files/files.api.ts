import { builder } from "api/builder";

export const postFile = builder
  .createCommand<{ response: string }, { file: File }>()({
    endpoint: "/api/files",
    method: "POST",
    queued: true,
    retry: 0,
  })
  .setDataMapper<FormData>((data) => {
    try {
      const formData = new FormData();
      formData.append("file", data.file);
      return formData;
    } catch (err) {
      return data;
    }
  });
