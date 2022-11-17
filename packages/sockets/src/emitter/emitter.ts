import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";

export class Emitter<DataType, ArgsType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions, MappedData> {
  readonly event: string;
  auth: boolean;
  headers: HeadersInit;
  retry: number;
  retryTime: number;
  options: SocketOptions;
  offline: boolean;
  used = false;
  data: DataType | null = null;
  args: ArgsType | null = null;
  queryParams: QueryParamsType | null = null;

  constructor(
    private socket: Socket<GlobalErrorType, SocketOptions>,
    emitterOptions: EmitterOptionsType<SocketOptions>,
    dump: Emitter<DataType, ArgsType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions, MappedData>,
    readonly dataMapper: (data: DataType) => MappedData,
  ) {
    const {
      event,
      headers,
      auth = true,
      options,
      retry = 0,
      retryTime = 500,
      offline = true,
    } = {
      // ...this.socket.emitterConfig?.(emitterOptions),
      ...emitterOptions,
    };

    this.event = dump?.event ?? event;
    this.headers = dump?.headers ?? headers;
    this.auth = dump?.auth ?? auth;
    this.args = dump?.args;
    this.data = dump?.data;
    this.queryParams = dump?.queryParams;
    this.options = dump?.options ?? options;
    this.retry = dump?.retry ?? retry;
    this.retryTime = dump?.retryTime ?? retryTime;
    this.offline = dump?.offline ?? offline;
    this.used = dump?.used ?? false;
  }

  setAuth(auth: boolean) {
    this.auth = auth;
  }

  setHeaders(headers: HeadersInit) {
    this.headers = headers;
  }

  setRetry(retry: number) {
    this.retry = retry;
  }

  setRetryTime(retryTime: number) {
    this.retryTime = retryTime;
  }

  setOptions(options: SocketOptions) {
    this.options = options;
  }

  setData(data: DataType) {
    this.data = data;
  }

  setArgs(args: ArgsType) {
    this.args = args;
  }

  setQueryParams(queryParams: QueryParamsType) {
    this.queryParams = queryParams;
  }

  setDataMapper = <MapperData>(mapper: (data: DataType) => MapperData) => {
    return this.clone(undefined, mapper);
  };

  clone<MapperData = MappedData>(
    options?: EmitterCloneOptionsType<DataType, ArgsType, QueryParamsType, SocketOptions>,
    mapper?: (data: DataType) => MapperData,
  ): Emitter<DataType, ArgsType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions, MapperData> {
    const dump = {
      ...this,
      data: options?.data || this.data,
      queryParams: options?.queryParams || this.queryParams,
      args: options?.args || this.args,
    } as unknown as Emitter<
      DataType,
      ArgsType,
      QueryParamsType,
      LocalErrorType,
      GlobalErrorType,
      SocketOptions,
      MapperData
    >;
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<DataType, ArgsType, QueryParamsType, LocalErrorType, GlobalErrorType, SocketOptions, MapperData>(
      this.socket,
      options,
      dump,
      mapperFn,
    );
  }

  emit() {
    console.error("TODO");
    return !!this.socket;
  }
}
