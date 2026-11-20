import type { QueryParamsType } from "@hyper-fetch/core";
import { SocketAdapter } from "adapter";
import type { ConnectionAttemptType, ConnectionLossType, ShouldReconnectType } from "connection";
import { createReconnectingConnection } from "connection";
import type { SocketOptionsType } from "socket";
import { Socket } from "socket";

/** A transport the test drives by hand - it opens, drops and recovers only when told to */
export class FakeTransport {
  static instances: FakeTransport[] = [];

  closed = false;

  constructor(readonly attempt: ConnectionAttemptType<FakeAdapterType>) {
    FakeTransport.instances.push(this);
  }

  static get last() {
    return FakeTransport.instances.at(-1) as FakeTransport;
  }

  /** Transports the engine did not close */
  static get open() {
    return FakeTransport.instances.filter((transport) => !transport.closed);
  }

  static reset() {
    FakeTransport.instances = [];
  }

  /** The connection is ready */
  serverReady() {
    this.attempt.ready();
  }

  /** The transport is gone */
  serverLost(loss?: ConnectionLossType) {
    this.attempt.lost(loss ?? { code: 1006 });
  }

  /** The connection dropped, the transport reconnects by itself */
  serverInterrupt() {
    this.attempt.interrupted();
  }

  close() {
    this.closed = true;
  }
}

export type FakeAdapterOptionsType = { autoConnect?: boolean; failOpen?: boolean };

export type FakeAdapterType = SocketAdapter<
  undefined,
  FakeAdapterOptionsType,
  undefined,
  undefined,
  QueryParamsType | string
>;

/** A socket adapter built on the reconnection engine, with a fake transport */
export const FakeAdapter = ({ shouldReconnect }: { shouldReconnect?: ShouldReconnectType } = {}): FakeAdapterType =>
  new SocketAdapter<undefined, FakeAdapterOptionsType, undefined, undefined, QueryParamsType | string>({
    name: "fake",
  }).setConnector((bindings) => {
    const connection = createReconnectingConnection({
      bindings,
      autoConnect: bindings.adapter.adapterOptions?.autoConnect ?? true,
      shouldReconnect,
      open: (attempt) => {
        if (attempt.connection.adapterOptions?.failOpen) {
          bindings.onConnectFailed({ error: new Error("Cannot open the transport") });
          return null;
        }
        return new FakeTransport(attempt);
      },
    });

    return {
      ...connection,
      listen: (listener, callback) => bindings.onListen({ listener, callback }),
      emit: () => null,
    };
  });

export const createFakeSocket = (
  options?: Partial<SocketOptionsType<FakeAdapterType>> & { shouldReconnectByProtocol?: ShouldReconnectType },
) => {
  const { shouldReconnectByProtocol, ...socketOptions } = options ?? {};
  return new Socket<FakeAdapterType>({
    url: "fake://engine",
    adapter: FakeAdapter({ shouldReconnect: shouldReconnectByProtocol }),
    ...socketOptions,
  });
};

/** Lets the async parts of an attempt (onConnect interceptors) run */
export const settle = async () => {
  await vi.advanceTimersByTimeAsync(0);
};
