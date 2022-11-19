import { Socket } from "socket";
import { ListenerOptionsType, ListenerCloneOptionsType } from "listener";

export class Listener<ResponseType, QueryParamsType, GlobalErrorType, LocalErrorType, AdditionalListenerOptions> {
  readonly name: string;
  auth: boolean;
  headers: HeadersInit;
  options: AdditionalListenerOptions;
  queryParams: QueryParamsType | null = null;

  constructor(
    readonly socket: Socket<GlobalErrorType, AdditionalListenerOptions, unknown, unknown>,
    listenerOptions: ListenerOptionsType<AdditionalListenerOptions>,
    dump: Partial<Listener<ResponseType, QueryParamsType, GlobalErrorType, LocalErrorType, AdditionalListenerOptions>>,
  ) {
    const {
      name,
      headers,
      auth = true,
      options,
    } = {
      ...this.socket.listenerConfig?.(listenerOptions),
      ...listenerOptions,
    };

    this.name = dump?.name ?? name;
    this.headers = dump?.headers ?? headers;
    this.auth = dump?.auth ?? auth;
    this.queryParams = dump?.queryParams;
    this.options = dump?.options ?? options;
  }

  setAuth(auth: boolean) {
    this.auth = auth;
  }

  setHeaders(headers: HeadersInit) {
    this.headers = headers;
  }

  setOptions(options: AdditionalListenerOptions) {
    this.options = options;
  }

  setQueryParams(queryParams: QueryParamsType) {
    this.queryParams = queryParams;
  }

  clone(
    options?: ListenerCloneOptionsType<QueryParamsType, AdditionalListenerOptions>,
  ): Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, AdditionalListenerOptions> {
    const dump: Partial<
      Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, AdditionalListenerOptions>
    > = {
      ...this,
      queryParams: options?.queryParams || this.queryParams,
    };

    return new Listener<ResponseType, QueryParamsType, LocalErrorType, GlobalErrorType, AdditionalListenerOptions>(
      this.socket,
      options,
      dump,
    );
  }

  listen(listener: () => void) {
    const instance = this.clone();

    this.socket.client.listen(instance, listener);

    const removeListener = () => {
      this.socket.client.removeListener(instance, listener);
    };

    return [removeListener, listener];
  }
}
