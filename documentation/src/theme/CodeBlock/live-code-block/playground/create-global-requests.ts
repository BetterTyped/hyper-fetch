import { Client, HttpAdapterType } from "@hyper-fetch/core";

export const createGlobalRequests = (client: Client<Error, HttpAdapterType>) => {
  let failedRequest = 0;
  return {
    getUsers: client
      .createRequest<{
        response: { name: string; age: number }[];
        queryParams?: { search: string };
      }>()({
        endpoint: "/users",
        method: "GET",
      })
      .setMock(
        ({ request }) => ({
          data: [
            { name: "John Doe", age: 20 },
            { name: "Jane Doe", age: 21 },
            { name: "Jim Doe", age: 22 },
            { name: "Jill Doe", age: 23 },
            { name: "Jack Doe", age: 24 },
          ].filter((user) => {
            if (request.queryParams?.search) {
              return user.name.toLowerCase().includes(request.queryParams.search.toLowerCase());
            }
            return true;
          }),
          extra: {
            headers: {
              "x-custom-header": "custom-value",
            },
          },
          status: 200,
        }),
        {
          requestTime: 200,
          responseTime: 200,
          totalUploaded: 200,
          totalDownloaded: 300,
        },
      ),
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
        endpoint: "/upload-file",
        method: "POST",
        queryKey: "postFile",
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
    failingRequest: client
      .createRequest<{
        response: { message: string };
      }>()({
        endpoint: "/failing-request",
        method: "GET",
      })
      .setMock(
        () => {
          if (failedRequest === 0) {
            failedRequest = 1;
            return {
              error: new Error("Failed request"),
              status: 500,
              success: false,
            };
          }
          failedRequest = 0;
          return {
            data: {
              message: "Success request",
            },
            status: 200,
            success: true,
          };
        },
        {
          requestTime: 1000,
          responseTime: 1000,
          totalUploaded: 500,
          totalDownloaded: 500,
        },
      ),
    createUser: client
      .createRequest<{
        response: { id: number; name: string };
      }>()({
        endpoint: "/users",
        method: "POST",
      })
      .setMock(() => ({
        data: { id: Math.floor(Math.random() * 1000), name: "John Doe" },
        status: 200,
      })),
  };
};
