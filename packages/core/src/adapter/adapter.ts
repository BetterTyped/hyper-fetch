import { browserAdapter, serverAdapter, AdapterType } from "adapter";

export const adapter: AdapterType = async (request, requestId) => {
  if (request.client.appManager.isNodeJs || !window?.XMLHttpRequest) {
    return serverAdapter(request, requestId);
  }
  return browserAdapter(request, requestId);
};
