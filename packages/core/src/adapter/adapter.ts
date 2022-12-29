import { browserAdapter, serverAdapter, AdapterType } from "adapter";

export const adapter: AdapterType = async (request, requestId) => {
  if (!window?.XMLHttpRequest) {
    return serverAdapter(request, requestId);
  }
  return browserAdapter(request, requestId);
};
