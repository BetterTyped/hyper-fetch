// Events
export const getRequestIdEventKey = (key: string) => `${key}-request-id`;
export const getResponseEventKey = (key: string) => `${key}-response`;
export const getAbortEventKey = (key: string) => `${key}-request-abort`;
export const getAbortByIdEventKey = (key: string) => `${key}-request-abort-by-id`;
export const getRequestStartEventKey = (key: string) => `${key}-request-start`;
export const getResponseStartEventKey = (key: string) => `${key}-response-start`;
export const getUploadProgressEventKey = (key: string) => `${key}-request-progress`;
export const getDownloadProgressEventKey = (key: string) => `${key}-response-progress`;
