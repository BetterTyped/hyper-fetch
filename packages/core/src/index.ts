// rollup client entry point

// Exported first on purpose: tsgo (TS 7 preview) resolves the types of the program in import order, and a client
// built from a custom Adapter is close to its instantiation depth limit in `createRequest()()`
// (`__tests__/features/adapter/adapter.base.spec.ts`). Any other position pushes that spec over the limit.
export * from "./optimistic";
export * from "./plugin";
export * from "./client";
export * from "./cache";
export * from "./adapter";
export * from "./sdk";
export * from "./http-adapter";
export * from "./request";
export * from "./infinite";
export * from "./constants/time.constants";
export * from "./constants/http.constants";
export * from "./managers";
export * from "./dispatcher";
export * from "./mocker";
export * from "./types";
export * from "./utils";
