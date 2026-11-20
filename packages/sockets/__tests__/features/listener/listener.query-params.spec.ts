import { SocketAdapter } from "adapter";
import { Socket } from "socket";
import { expectTypeOf } from "vitest";

import { createSocket } from "../../utils/socket.utils";

type Filter = { field: string; value: string };

class FiltersBuilder {
  constructor(readonly filters: Filter[] = []) {}

  where = (field: string, value: string) => new FiltersBuilder([...this.filters, { field, value }]);

  toJSON = () => this.filters;
}

type FiltersQueryParams = Filter[] | ((builder: FiltersBuilder) => FiltersBuilder);

const createFiltersSocket = (onListen: (queryParams: unknown) => void) => {
  const adapter = new SocketAdapter<undefined, undefined, undefined, undefined, undefined, any, FiltersQueryParams>({
    name: "filters-socket",
    defaultConnected: true,
  }).setConnector(({ onListen: register }) => ({
    connect: () => null,
    reconnect: () => null,
    disconnect: () => null,
    emit: () => null,
    listen: (listener, callback) => {
      onListen(listener.queryParams);
      return register({ listener, callback });
    },
  }));
  adapter.setListenerQueryParamsResolver((callback) => (callback(new FiltersBuilder()) as FiltersBuilder).toJSON());

  return new Socket({ url: "ws://localhost:1234", adapter });
};

describe("Listener [ Query params ]", () => {
  let listened: unknown[] = [];
  let socket = createFiltersSocket((queryParams) => listened.push(queryParams));

  beforeEach(() => {
    listened = [];
    socket = createFiltersSocket((queryParams) => listened.push(queryParams));
  });

  it("should store the data a callback resolves to in createListener", () => {
    const listener = socket.createListener()({
      topic: "users",
      queryParams: (filters) => filters.where("role", "admin"),
    });

    expect(listener.queryParams).toStrictEqual([{ field: "role", value: "admin" }]);
  });

  it("should resolve a callback given to setQueryParams and keep it in clones", () => {
    const listener = socket
      .createListener()({ topic: "users" })
      .setQueryParams((filters) => filters.where("role", "admin"));

    expect(listener.queryParams).toStrictEqual([{ field: "role", value: "admin" }]);
    expect(listener.clone().queryParams).toStrictEqual([{ field: "role", value: "admin" }]);
    expect(listener.setOptions(undefined).queryParams).toStrictEqual([{ field: "role", value: "admin" }]);
  });

  it("should give the adapter the resolved data when listening", () => {
    const stop = socket
      .createListener()({ topic: "users" })
      .setQueryParams((filters) => filters.where("role", "admin"))
      .listen(() => null);

    expect(listened).toStrictEqual([[{ field: "role", value: "admin" }]]);
    stop();
  });

  it("should leave data query params untouched", () => {
    const data = [{ field: "role", value: "admin" }];
    const listener = socket.createListener()({ topic: "users" }).setQueryParams(data);

    expect(listener.queryParams).toBe(data);
  });

  it("should store query params as given when the adapter has no resolver", () => {
    const plain = new SocketAdapter<undefined, undefined, undefined, undefined, undefined, any, FiltersQueryParams>({
      name: "plain",
      defaultConnected: true,
    }).setConnector(() => ({
      connect: () => null,
      reconnect: () => null,
      disconnect: () => null,
      emit: () => null,
      listen: () => () => null,
    }));
    const callback = (filters: FiltersBuilder) => filters.where("role", "admin");
    const listener = new Socket({ url: "ws://localhost:1234", adapter: plain })
      .createListener()({ topic: "users" })
      .setQueryParams(callback);

    expect(listener.queryParams).toBe(callback);
  });

  it("should not accept query params on adapters that do not declare them", () => {
    const listener = createSocket().createListener()({ topic: "users" });

    expectTypeOf(listener.queryParams).toEqualTypeOf<undefined>();
    // @ts-expect-error - the WebSocket adapter has no listener query params
    listener.setQueryParams([{ field: "role", value: "admin" }]);
  });
});
