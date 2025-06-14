import { RequestInstance } from "request";

export const getUniqueRequestId = (request: Pick<RequestInstance, "queryKey">) => {
  return `${request.queryKey}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
};
