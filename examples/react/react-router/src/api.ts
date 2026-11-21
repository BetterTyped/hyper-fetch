import { createClient, Time } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type UserSummary = { id: number; firstName: string; lastName: string };
export type User = UserSummary & {
  email: string;
  phone: string;
  company: { title: string };
};
export type UserChanges = Pick<User, "firstName" | "lastName" | "email" | "phone">;

const searchUsers = client.createRequest<{
  response: { users: UserSummary[] };
  queryParams: { q: string; limit: number; select: string };
}>()({
  endpoint: "/users/search",
  // Data is fresh for 30 seconds: until then, loaders and hooks read it from the cache.
  staleTime: 30 * Time.SEC,
});

const getUser = client.createRequest<{
  response: User;
  queryParams: { select: string };
}>()({
  endpoint: "/users/:userId",
  staleTime: 30 * Time.SEC,
});

export const updateUser = client.createRequest<{
  response: User;
  payload: UserChanges;
}>()({
  endpoint: "/users/:userId",
  method: "PUT",
});

// The loader and the component build the request with the same function, so they share one cache key.
export const userList = (q: string) => searchUsers.setQueryParams({ q, limit: 12, select: "firstName,lastName" });
export const userDetails = (userId: number) =>
  getUser.setParams({ userId }).setQueryParams({ select: "firstName,lastName,email,phone,company" });

// A tiny log of the requests that reach the network, to show which navigations were served from the cache.
let networkLog: string[] = [];
const listeners = new Set<() => void>();
client.onRequest((request) => {
  networkLog = [`${request.method} ${request.endpoint}`, ...networkLog].slice(0, 6);
  listeners.forEach((listener) => listener());
  return request;
});
export const getNetworkLog = () => networkLog;
export const subscribeNetworkLog = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
