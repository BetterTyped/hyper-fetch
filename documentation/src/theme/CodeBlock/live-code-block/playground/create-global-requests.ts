import { Client, HttpAdapterType } from "@hyper-fetch/core";

export const createGlobalRequests = (client: Client<Error, HttpAdapterType>) => {
  return {
    getUser: client
      .createRequest<{
        response: { name: string; age: number };
      }>()({
        endpoint: "/users/:userId",
        method: "GET",
      })
      .setParams({
        userId: 1,
      })
      .setMock(
        () => ({
          data: { name: "John Doe", age: 20 },
          extra: {
            headers: {
              "x-custom-header": "custom-value",
            },
          },
          status: 200,
        }),
        {
          requestTime: 1500,
          responseTime: 1500,
          totalUploaded: 200,
          totalDownloaded: 300,
        },
      ),
    postFile: client
      .createRequest<{
        response: { message: string };
      }>()({
        endpoint: "/upload",
        method: "POST",
      })
      .setMock(
        () => ({
          data: {
            message: "File uploaded successfully",
          },
          extra: {
            headers: {
              "x-custom-header": "custom-value-2",
            },
          },
          status: 200,
        }),
        {
          requestTime: 2000,
          responseTime: 2000,
          totalUploaded: 1000,
          totalDownloaded: 1000,
        },
      ),
  };
};
