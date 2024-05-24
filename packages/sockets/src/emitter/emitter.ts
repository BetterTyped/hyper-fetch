import { DateInterval, ExtractRouteParams, ParamsType, TypeWithDefaults, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterAcknowledgeType, EmitterOptionsType, EmitType } from "emitter";
import { SocketAdapterInstance, SocketAdapterType } from "adapter";
import { ConnectMethodType, ExtractEmitterOptionsType } from "types";

export class Emitter<
  Properties extends {
    payload: any;
    response: any;
    endpoint: string;
    adapter: SocketAdapterInstance;
    mappedData: any;
    hasParams?: boolean;
    hasData?: boolean;
  } = {
    payload: undefined;
    response: undefined;
    endpoint: string;
    adapter: SocketAdapterType;
    mappedData: void;
    hasParams: false;
    hasData: false;
  },
> {
  readonly endpoint: TypeWithDefaults<Properties, "endpoint", string>;
  params?: ParamsType;
  timeout: number;
  data: TypeWithDefaults<Properties, "payload", undefined> | null = null;
  options: ExtractEmitterOptionsType<Properties["adapter"]>;
  connections: Set<
    ConnectMethodType<
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>,
      TypeWithDefaults<Properties, "response", undefined>
    >
  > = new Set();

  dataMapper?: (
    data: TypeWithDefaults<Properties, "payload", undefined>,
  ) => TypeWithDefaults<Properties, "mappedData", undefined>;

  constructor(
    readonly socket: Socket<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>,
    readonly emitterOptions: EmitterOptionsType<
      TypeWithDefaults<Properties, "endpoint", string>,
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>
    >,
    json?: Pick<
      Emitter<{
        payload: TypeWithDefaults<Properties, "payload", undefined>;
        response: TypeWithDefaults<Properties, "response", undefined>;
        endpoint: TypeWithDefaults<Properties, "endpoint", string>;
        adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
        mappedData: TypeWithDefaults<Properties, "mappedData", undefined>;
        hasParams: TypeWithDefaults<Properties, "hasData", false>;
        hasData: TypeWithDefaults<Properties, "hasParams", false>;
      }>,
      "endpoint" | "params" | "timeout" | "data" | "options" | "connections"
    >,
  ) {
    const { endpoint, timeout = DateInterval.second * 2, options } = emitterOptions;

    this.endpoint = json?.endpoint ?? endpoint;
    this.data = json?.data;
    this.timeout = json?.timeout ?? timeout;
    this.options = json?.options ?? options;
    this.params = json?.params;
  }

  setOptions(options: ExtractEmitterOptionsType<TypeWithDefaults<Properties, "adapter", SocketAdapterType>>) {
    return this.clone({ options });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setData(data: TypeWithDefaults<Properties, "payload", undefined>) {
    if (this.dataMapper) {
      return this.clone<{
        payload: TypeWithDefaults<Properties, "mappedData", TypeWithDefaults<Properties, "payload", undefined>>;
        hasData: true;
      }>({ data: this.dataMapper(data) });
    }
    return this.clone<{ hasData: true }>({ data });
  }

  setDataMapper = <MapperData>(mapper: (data: TypeWithDefaults<Properties, "payload", undefined>) => MapperData) => {
    const newInstance = this.clone<{ mappedData: MapperData }>(undefined);
    newInstance.dataMapper = mapper;
    return newInstance;
  };

  setParams(params: ExtractRouteParams<TypeWithDefaults<Properties, "endpoint", string>>) {
    return this.clone<{ hasParams: true }>({ params });
  }

  /**
   * Attach global logic to the received events
   * @param callback
   */
  onData(
    callback: ConnectMethodType<
      TypeWithDefaults<Properties, "adapter", SocketAdapterType>,
      TypeWithDefaults<Properties, "response", undefined>
    >,
  ) {
    this.connections.add(callback);

    return this;
  }

  private paramsMapper = (params: ParamsType | null | undefined): TypeWithDefaults<Properties, "endpoint", string> => {
    let endpoint = this.emitterOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return endpoint as TypeWithDefaults<Properties, "endpoint", string>;
  };

  clone<
    Extensions extends {
      payload?: any;
      mappedData?: any;
      hasParams?: true | false;
      hasData?: true | false;
    } = {
      payload: TypeWithDefaults<Properties, "payload", undefined>;
      mappedData: TypeWithDefaults<Properties, "mappedData", void>;
      hasParams: TypeWithDefaults<Properties, "hasParams", false>;
      hasData: TypeWithDefaults<Properties, "hasData", false>;
    },
  >(
    options?: Partial<
      EmitterOptionsType<
        TypeWithDefaults<Properties, "endpoint", string>,
        TypeWithDefaults<Properties, "adapter", SocketAdapterType>
      >
    > & {
      params?: ParamsType;
      data?: TypeWithDefaults<Extensions, "payload", undefined>;
    },
    mapper?: (
      data: TypeWithDefaults<Extensions, "payload", undefined>,
    ) => TypeWithDefaults<Extensions, "mappedData", void>,
  ) {
    type NewPayload = TypeWithDefaults<Extensions, "payload", TypeWithDefaults<Properties, "payload", undefined>>;
    type NewMappedData = TypeWithDefaults<
      Extensions,
      "mappedData",
      TypeWithDefaults<Properties, "mappedData", undefined>
    >;
    type NewHasParams = TypeWithDefaults<Extensions, "hasParams", TypeWithDefaults<Properties, "hasParams", false>>;
    type NewHasData = TypeWithDefaults<Extensions, "hasData", TypeWithDefaults<Properties, "hasData", false>>;

    const json: Pick<
      Emitter<{
        payload: NewPayload;
        response: TypeWithDefaults<Properties, "response", undefined>;
        endpoint: TypeWithDefaults<Properties, "endpoint", string>;
        adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
        mappedData: NewMappedData;
        hasParams: NewHasParams;
        hasData: NewHasData;
      }>,
      "endpoint" | "params" | "timeout" | "data" | "options" | "connections"
    > = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      params: options?.params || this.params,
      ...options,
      endpoint: this.paramsMapper(options?.params || this.params),
      connections: this.connections,
    };

    const newInstance = new Emitter<{
      payload: NewPayload;
      response: TypeWithDefaults<Properties, "response", undefined>;
      endpoint: TypeWithDefaults<Properties, "endpoint", string>;
      adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
      mappedData: NewMappedData;
      hasParams: NewHasParams;
      hasData: NewHasData;
    }>(this.socket, this.emitterOptions, json);
    newInstance.dataMapper = (mapper || this.dataMapper) as unknown as typeof newInstance.dataMapper;
    newInstance.connections = this.connections;
    return newInstance;
  }

  getAck = (ack?: EmitterAcknowledgeType<any, TypeWithDefaults<Properties, "adapter", SocketAdapterType>>) => {
    if (ack) {
      return (response: { data: any; extra: any; error: any }) => {
        this.connections.forEach((connection) => connection(response, () => this.connections.delete(connection)));
        return ack(response as any);
      };
    }
    if (this.connections.size) {
      return (response: { data: any; extra: any; error: any }) => {
        this.connections.forEach((connection) => connection(response, () => this.connections.delete(connection)));
      };
    }
    return undefined;
  };

  emit: EmitType<
    Emitter<{
      payload: TypeWithDefaults<Properties, "payload", undefined>;
      response: TypeWithDefaults<Properties, "response", undefined>;
      endpoint: TypeWithDefaults<Properties, "endpoint", string>;
      adapter: TypeWithDefaults<Properties, "adapter", SocketAdapterType>;
      mappedData: TypeWithDefaults<Properties, "mappedData", void>;
      hasParams: TypeWithDefaults<Properties, "hasParams", false>;
      hasData: TypeWithDefaults<Properties, "hasData", false>;
    }>
  > = ({
    data,
    params,
    options,
    ack,
  }: {
    data?: TypeWithDefaults<Properties, "payload", undefined>;
    params?: ParamsType;
    options?: Partial<
      EmitterOptionsType<
        TypeWithDefaults<Properties, "endpoint", string>,
        TypeWithDefaults<Properties, "adapter", SocketAdapterType>
      >
    >;
    ack?: EmitterAcknowledgeType<any, TypeWithDefaults<Properties, "adapter", SocketAdapterType>>;
  } = {}) => {
    const instance = this.clone({ ...options, data, params });

    const eventMessageId = getUniqueRequestId(instance.endpoint);

    this.socket.adapter.emit(eventMessageId, instance, instance.getAck(ack));
    return eventMessageId;
  };
}
