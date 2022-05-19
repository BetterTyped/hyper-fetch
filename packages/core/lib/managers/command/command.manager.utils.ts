// Events
export const getAbortEventKey = (key: string) => `${key}-request-abort`;
export const getResponseEventKey = (key: string) => `${key}-response`;
export const getAbortByIdEventKey = (key: string) => `${key}-request-abort-by-id`;
export const getResponseIdEventKey = (key: string) => `${key}-response-id`;
export const getRequestStartEventKey = (key: string) => `${key}-request-start`;
export const getResponseStartEventKey = (key: string) => `${key}-response-start`;
export const getUploadProgressEventKey = (key: string) => `${key}-request-progress`;
export const getDownloadProgressEventKey = (key: string) => `${key}-response-progress`;
