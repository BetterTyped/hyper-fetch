import { createClient } from "@hyper-fetch/core";

export const createGoogleSheetsClient = () => {
  return createClient({
    url: "https://sheets.googleapis.com/v4/spreadsheets",
  });
};

export const createGoogleSheetsSDK = (client: ReturnType<typeof createGoogleSheetsClient>) => {
  return {
    spreadsheets: {
      get: client.createRequest()({
        endpoint: "/spreadsheets/:spreadsheetId",
        method: "GET",
      }),
    },
  };
};
