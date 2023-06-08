import { client } from "../builder";

export const postFile = client
  .createRequest<{ response: string }, { file: File }>()({
    endpoint: "/api/files",
    method: "POST",
    queued: true,
    retry: 0,
  })
  .setDataMapper((data) => {
    const formData = new FormData();
    formData.append("file", data.file);
    return formData;
  });
