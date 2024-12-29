export * from "./http";
export * from "./graphql";
export * from "./sse";
export * from "./websockets";
export * from "./types";

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
