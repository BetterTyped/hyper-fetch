import { createClient } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

export const client = createClient({ url: "https://dummyjson.com" });

// Development only: the plugin streams every request, response and cache change to the HyperFlow desktop app.
if (import.meta.env.DEV) {
  client.addPlugin(
    DevtoolsPlugin({
      // The name HyperFlow shows for this app. `environment` tells apart several builds of the same app.
      appName: "HyperFetch devtools example",
      environment: import.meta.env.MODE,
    }),
  );
}

export type User = { id: number; firstName: string; lastName: string; email: string };

export const getUsers = client.createRequest<{
  response: { users: User[]; total: number };
  queryParams: { limit: number; select: string };
}>()({
  endpoint: "/users",
});

export const addUser = client.createRequest<{ response: User; payload: Omit<User, "id"> }>()({
  endpoint: "/users/add",
  method: "POST",
});

/** Answers with the status code in the URL, for a failed request to inspect. */
export const getStatus = client.createRequest<{ response: { status: string; message: string } }>()({
  endpoint: "/http/:status",
});

/** Answers after `delay` milliseconds, long enough to see the request in flight and to cancel it. */
export const getSlowUsers = client.createRequest<{
  response: { users: User[] };
  queryParams: { limit: number; delay: number };
}>()({
  endpoint: "/users",
});
