import { FetchMiddlewareInstance } from "middleware";

export const mockMiddleware = (
  middleware: FetchMiddlewareInstance,
  fetchMock: VoidFunction,
): FetchMiddlewareInstance => {
  const newMiddleware = middleware.clone();
  newMiddleware.fetch = fetchMock as any;
  return newMiddleware;
};
