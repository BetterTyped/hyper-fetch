import { Time } from "@hyper-fetch/core";

import { client } from "../client";

export const getTea = client.createRequest()({
  endpoint: "/api/teas/:teaId",
  cache: true,
  cacheTime: Time.SEC * 10,
  cacheKey: "teaId",
});

export const duplicatedGetTea = client.createRequest()({
  endpoint: "/api/teas/:teaId",
  cache: true,
  cacheTime: Time.SEC * 10,
  cacheKey: "teaId",
});

export const getTeas = client.createRequest()({
  endpoint: "/api/teas",
  cache: true,
  cacheTime: Time.SEC * 5,
});

export const createTea = client.createRequest()({
  endpoint: "/api/teas",
  method: "POST",
  cancelable: true,
  cacheTime: Time.SEC * 5,
});

export const updateTea = client.createRequest()({
  endpoint: "/api/teas/:teaId",
  method: "PATCH",
  cancelable: false,
});

export const deleteTea = client.createRequest()({
  endpoint: "/api/teas/:userId",
  method: "DELETE",
});
