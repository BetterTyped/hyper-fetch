export * from "./http";
export * from "./graphql";
export * from "./sse";
export * from "./websockets";

export const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
