import { createClient } from "@hyper-fetch/core";

export type Tokens = { accessToken: string; refreshToken: string };

export type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
};

/** Tokens live in localStorage, so a reload keeps you logged in. */
const TOKENS_KEY = "hyper-fetch-auth-tokens";

export const tokens = {
  get: (): Tokens | null => JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "null"),
  set: (value: Tokens) => localStorage.setItem(TOKENS_KEY, JSON.stringify(value)),
  remove: () => localStorage.removeItem(TOKENS_KEY),
};

/** A tiny activity log, so the token flow is visible in the UI. */
const logListeners = new Set<(message: string) => void>();
export const onLog = (listener: (message: string) => void) => {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
};
const log = (message: string) => logListeners.forEach((listener) => listener(message));

export const client = createClient({ url: "https://dummyjson.com" })
  // Runs for every request with `auth: true` (the default) right before it is sent.
  .onAuth((request) => {
    const accessToken = tokens.get()?.accessToken;
    if (!accessToken) return request;
    log(`${request.method} ${request.endpoint}: attach access token`);
    return request.setHeaders({ ...request.headers, Authorization: `Bearer ${accessToken}` });
  })
  // Runs for every failed response. Whatever it returns becomes the response of the original request.
  .onError(async (response, request) => {
    const refreshToken = tokens.get()?.refreshToken;

    // `used` marks the retried request, so a second 401 does not start another refresh.
    if (response.status !== 401 || !refreshToken || request.used) return response;

    log(`${request.endpoint} returned 401, refreshing the token`);
    const { data, error } = await refresh.send({ payload: { refreshToken, expiresInMins: 5 } });

    if (error || !data) {
      log("Refresh failed, logging out");
      tokens.remove();
      return response;
    }

    tokens.set(data);
    log(`Token refreshed, sending ${request.endpoint} again`);
    return request.setUsed(true).send();
  });

/** `auth: false` skips `onAuth`: there is no token to attach yet. */
export const login = client.createRequest<{
  response: Tokens & User;
  payload: { username: string; password: string; expiresInMins: number };
}>()({
  endpoint: "/auth/login",
  method: "POST",
  auth: false,
});

export const refresh = client.createRequest<{
  response: Tokens;
  payload: { refreshToken: string; expiresInMins: number };
}>()({
  endpoint: "/auth/refresh",
  method: "POST",
  auth: false,
});

/** Needs the token. `onAuth` adds it, so the request itself knows nothing about tokens. */
export const getMe = client.createRequest<{ response: User }>()({
  endpoint: "/auth/me",
});
