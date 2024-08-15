// Events

export const getLoadingKey = (): string => `loading-event-any`;
export const getLoadingByQueueKey = (queueKey: string): string => `${queueKey}-loading-event`;
export const getLoadingByCacheKey = (cacheKey: string): string => `${cacheKey}-loading-cache-event`;
export const getLoadingByIdKey = (id: string): string => `${id}-loading-event-by-id`;
export const getRemoveKey = (): string => `remove-event-any`;
export const getRemoveByQueueKey = (queueKey: string): string => `${queueKey}-remove-event`;
export const getRemoveByIdKey = (id: string): string => `${id}-remove-event-by-id`;
export const getAbortKey = () => `request-abort-any`;
export const getAbortByAbortKey = (abortKey: string) => `${abortKey}-request-abort`;
export const getAbortByIdKey = (id: string) => `${id}-request-abort-by-id`;
export const getResponseKey = () => `response-any`;
export const getResponseByCacheKey = (cacheKey: string) => `${cacheKey}-response`;
export const getResponseByIdKey = (id: string) => `${id}-response-by-id`;
export const getRequestStartKey = () => `request-start-any`;
export const getRequestStarByQueueKey = (queueKey: string) => `${queueKey}-request-start`;
export const getRequestStartByIdKey = (id: string) => `${id}-request-start-by-id`;
export const getResponseStartKey = () => `response-start-any`;
export const getResponseStartByQueueKey = (queueKey: string) => `${queueKey}-response-start`;
export const getResponseStartByIdKey = (id: string) => `${id}-response-start-by-id`;
export const getUploadProgressKey = () => `request-progress-any`;
export const getUploadProgressByQueueKey = (queueKey: string) => `${queueKey}-request-progress`;
export const getUploadProgressByIdKey = (id: string) => `${id}-request-progress-by-id`;
export const getDownloadProgressKey = () => `response-progress-any`;
export const getDownloadProgressByQueueKey = (queueKey: string) => `${queueKey}-response-progress`;
export const getDownloadProgressByIdKey = (id: string) => `${id}-response-progress-by-id`;
