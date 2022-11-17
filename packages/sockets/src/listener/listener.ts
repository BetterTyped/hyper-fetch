import { Socket } from "socket";
import { ListenerOptionsType, ListenerCloneOptionsType } from "listener";

export class Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions> {
  readonly event: string;
  auth: boolean;
  headers: HeadersInit;
  options: SocketOptions;
  queryParams: QueryParamsType | null = null;
  offline: boolean;
  used = false;

  constructor(
    private socket: Socket<GlobalErrorType, SocketOptions>,
    listenerOptions: ListenerOptionsType<SocketOptions>,
    dump: Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions>,
  ) {
    const {
      event,
      headers,
      auth = true,
      options,
      offline = true,
    } = {
      // ...this.socket.listenerConfig?.(listenerOptions),
      ...listenerOptions,
    };

    this.event = dump?.event ?? event;
    this.headers = dump?.headers ?? headers;
    this.auth = dump?.auth ?? auth;
    this.queryParams = dump?.queryParams;
    this.options = dump?.options ?? options;
    this.offline = dump?.offline ?? offline;
    this.used = dump?.used ?? false;
  }

  setAuth(auth: boolean) {
    this.auth = auth;
  }

  setHeaders(headers: HeadersInit) {
    this.headers = headers;
  }

  setOptions(options: SocketOptions) {
    this.options = options;
  }

  setQueryParams(queryParams: QueryParamsType) {
    this.queryParams = queryParams;
  }

  clone(
    options?: ListenerCloneOptionsType<QueryParamsType, SocketOptions>,
  ): Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions> {
    const dump = {
      ...this,
      queryParams: options?.queryParams || this.queryParams,
    } as unknown as Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions>;

    return new Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions>(
      this.socket,
      options,
      dump,
    );
  }

  on() {
    console.error("TODO");
    return !!this.socket;
  }

  once() {
    console.error("TODO");
    return !!this.socket;
  }
}
