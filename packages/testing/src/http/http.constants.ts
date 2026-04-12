export type StatusCodesType = 200 | StatusErrorCodesType;
export type StatusErrorCodesType = 400 | 401 | 403 | 404 | 500;
export type ErrorMockType = { message: string };

export const errorResponses: Record<StatusErrorCodesType, ErrorMockType> = {
  401: {
    message: "Unathorized",
  },
  400: {
    message: "Error",
  },
  403: {
    message: "Forbidden",
  },
  404: {
    message: "Not found",
  },
  500: {
    message: "Server Error",
  },
};
