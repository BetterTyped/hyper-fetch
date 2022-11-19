import { Socket } from "socket";
import { EmitterOptionsType, EmitterCloneOptionsType } from "emitter";

export class Emitter<
  DataType,
  ArgsType,
  QueryParamsType,
  LocalErrorType,
  GlobalErrorType,
  AdditionalEmitterOptions,
  MappedData,
> {
  readonly event: string;
  auth: boolean;
  headers: HeadersInit;
  options: AdditionalEmitterOptions;
  data: DataType | null = null;
  args: ArgsType | null = null;
  queryParams: QueryParamsType | null = null;

  constructor(
    readonly socket: Socket<GlobalErrorType, unknown, AdditionalEmitterOptions, unknown>,
    emitterOptions: EmitterOptionsType<AdditionalEmitterOptions>,
    dump: Partial<
      Emitter<
        DataType,
        ArgsType,
        QueryParamsType,
        LocalErrorType,
        GlobalErrorType,
        AdditionalEmitterOptions,
        MappedData
      >
    >,
    readonly dataMapper: (data: DataType) => MappedData,
  ) {
    const {
      event,
      headers,
      auth = true,
      options,
    } = {
      ...this.socket.emitterConfig?.(emitterOptions),
      ...emitterOptions,
    };

    this.event = dump?.event ?? event;
    this.headers = dump?.headers ?? headers;
    this.auth = dump?.auth ?? auth;
    this.args = dump?.args;
    this.data = dump?.data;
    this.queryParams = dump?.queryParams;
    this.options = dump?.options ?? options;
  }

  setAuth(auth: boolean) {
    this.auth = auth;
  }

  setHeaders(headers: HeadersInit) {
    this.headers = headers;
  }

  setOptions(options: AdditionalEmitterOptions) {
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
    options?: EmitterCloneOptionsType<DataType, ArgsType, QueryParamsType, AdditionalEmitterOptions>,
    mapper?: (data: DataType) => MapperData,
  ): Emitter<
    DataType,
    ArgsType,
    QueryParamsType,
    LocalErrorType,
    GlobalErrorType,
    AdditionalEmitterOptions,
    MapperData
  > {
    const dump: Partial<
      Emitter<
        DataType,
        ArgsType,
        QueryParamsType,
        LocalErrorType,
        GlobalErrorType,
        AdditionalEmitterOptions,
        MapperData
      >
    > = {
      ...(this as any),
      data: options?.data || this.data,
      queryParams: options?.queryParams || this.queryParams,
      args: options?.args || this.args,
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    return new Emitter<
      DataType,
      ArgsType,
      QueryParamsType,
      LocalErrorType,
      GlobalErrorType,
      AdditionalEmitterOptions,
      MapperData
    >(this.socket, options, dump, mapperFn);
  }

  emit(options?: any) {
    const instance = this.clone(options);

    return this.socket.client.emit(instance);
  }
}
