// Events

export const getLoadingEventKey = (key: string): string => `${key}-loading-event`;
export const getLoadingIdEventKey = (key: string): string => `${key}-loading-event-by-id`;
export const getRemoveEventKey = (key: string): string => `${key}-remove-event`;

export const getAbortEventKey = (key: string) => `${key}-request-abort`;
export const getAbortByIdEventKey = (key: string) => `${key}-request-abort-by-id`;
export const getResponseEventKey = (key: string) => `${key}-response`;
export const getResponseIdEventKey = (key: string) => `${key}-response-by-id`;
export const getRequestStartEventKey = (key: string) => `${key}-request-start`;
export const getRequestStartIdEventKey = (key: string) => `${key}-request-start-by-id`;
export const getResponseStartEventKey = (key: string) => `${key}-response-start`;
export const getResponseStartIdEventKey = (key: string) => `${key}-response-start-by-id`;
export const getUploadProgressEventKey = (key: string) => `${key}-request-progress`;
export const getUploadProgressIdEventKey = (key: string) => `${key}-request-progress-by-id`;
export const getDownloadProgressEventKey = (key: string) => `${key}-response-progress`;
export const getDownloadProgressIdEventKey = (key: string) => `${key}-response-progress-by-id`;
