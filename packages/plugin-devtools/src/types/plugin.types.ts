import type { SocketInstance } from "@hyper-fetch/sockets";

export type DevtoolsPluginOptions = {
  /**
   * Name of your application, it will be displayed in the HyperFlow app
   */
  appName: string;
  /**
   * URL of the HyperFlow server
   * Needed only if you change the default port in the HyperFlow app
   * @default "ws://localhost:2137"
   */
  url?: string;
  /**
   * Enable debug mode logs, so you can see what's happening in plugin
   * @default false
   */
  debug?: boolean;
  /**
   * App environment indication (e.g., "development", "staging", "production").
   * Displayed alongside the app name in HyperFlow to distinguish deployments.
   */
  environment?: string;
  /**
   * The `WebSocket` constructor used to connect to HyperFlow. Defaults to the global `WebSocket` of browsers,
   * Node.js 22+, Deno and Bun. On older Node.js pass the one from the `ws` package: `import { WebSocket } from "ws"`.
   */
  WebSocket?: typeof WebSocket;
  /**
   * Sockets to inspect in HyperFlow next to the requests of the client: their connection, the messages they receive
   * and send, and their errors.
   * @example DevtoolsPlugin({ appName: "My App", sockets: [socket] })
   */
  sockets?: SocketInstance[];
};
