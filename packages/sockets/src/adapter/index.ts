export * from "./adapter.bindings";
export * from "./adapter.types";
export * from "./adapter";

export type SocketData<D = any> = { topic: string; payload: D };
