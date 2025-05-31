export type StatusCodesType = 200 | StatusErrorCodesType;
export type StatusErrorCodesType = 400 | 401 | 404 | 500;
export type ErrorMockType = { message: string };

export const errorResponses: Record<StatusErrorCodesType, ErrorMockType> = {
  401: {
    message: "Unathorized",
  },
  400: {
    message: "Error",
  },
  404: {
    message: "Not found",
  },
  500: {
    message: "Server Error",
  },
};
