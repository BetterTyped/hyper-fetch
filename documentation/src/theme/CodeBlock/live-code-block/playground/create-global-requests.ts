import { ClientInstance } from "@hyper-fetch/core";

export const createGlobalRequests = (client: ClientInstance) => {
  return {
    getUser: client
      .createRequest<{
        response: { name: string; age: number };
      }>()({
        endpoint: "/users/1",
        method: "GET",
      })
      .setMock(
        () => ({
          data: { name: "John Doe", age: 20 },
          status: 200,
        }),
        {
          requestTime: 500,
          responseTime: 500,
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
          status: 200,
        }),
        {
          requestTime: 1500,
          responseTime: 1500,
        },
      ),
  };
};
