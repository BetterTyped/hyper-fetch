import { browserAdapter, serverAdapter, BaseAdapterType } from "adapter";

export const adapter: BaseAdapterType = async (request, requestId) => {
  if (!window?.XMLHttpRequest) {
    return serverAdapter(request, requestId);
  }
  return browserAdapter(request, requestId);
};
