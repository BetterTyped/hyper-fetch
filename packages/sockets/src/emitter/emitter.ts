import { DateInterval, ExtractRouteParams, ParamsType, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterAcknowledgeType, EmitterOptionsType, EmitType } from "emitter";
import { SocketAdapterType, ExtractEmitterOptionsType } from "adapter";
import { ConnectMethodType } from "types";

export class Emitter<
  Payload,
  Response,
  Endpoint extends string,
  AdapterType extends SocketAdapterType,
  MappedData = void,
  HasParams extends boolean = false,
  HasData extends boolean = false,
> {
  readonly endpoint: Endpoint;
  params?: ParamsType;
  timeout: number;
  data: Payload | null = null;
  options: ExtractEmitterOptionsType<AdapterType>;
  connections: Set<ConnectMethodType<AdapterType, Response>> = new Set();

  constructor(
    readonly socket: Socket<AdapterType>,
    readonly emitterOptions: EmitterOptionsType<Endpoint, AdapterType>,
    json?: Partial<Emitter<Payload, Response, Endpoint, AdapterType, MappedData>>,
    readonly dataMapper?: (data: Payload) => MappedData,
  ) {
    const { endpoint, timeout = DateInterval.second * 2, options } = emitterOptions;

    this.endpoint = json?.endpoint ?? endpoint;
    this.data = json?.data;
    this.timeout = json?.timeout ?? timeout;
    this.options = json?.options ?? options;
    this.params = json?.params;
  }

  setOptions(options: ExtractEmitterOptionsType<AdapterType>) {
    return this.clone({ options });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setData(data: Payload) {
    if (this.dataMapper) {
      return this.clone<MappedData, MappedData, HasParams, true>({ data: this.dataMapper(data) });
    }
    return this.clone<Payload, MappedData, HasParams, true>({ data });
  }

  setDataMapper = <MapperData>(mapper: (data: Payload) => MapperData) => {
    return this.clone<Payload, MapperData>(undefined, mapper);
  };

  setParams(params: ExtractRouteParams<Endpoint>) {
    return this.clone<Payload, MappedData, true>({ params });
  }

  /**
   * Attach global logic to the received events
   * @param callback
   */
  onData(callback: ConnectMethodType<AdapterType, Response>) {
    this.connections.add(callback);

    return this;
  }

  private paramsMapper = (params: ParamsType | null | undefined): Endpoint => {
    let endpoint = this.emitterOptions.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return endpoint as Endpoint;
  };

  clone<
    NewPayload = Payload,
    MapperData = MappedData,
    Params extends boolean = HasParams,
    Data extends boolean = HasData,
  >(
    options?: Partial<EmitterOptionsType<Endpoint, AdapterType>> & { params?: ParamsType; data?: NewPayload },
    mapper?: (data: NewPayload) => MapperData,
  ) {
    const json: Partial<Emitter<NewPayload, Response, Endpoint, AdapterType, MapperData, Params, Data>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      params: options?.params || this.params,
      ...options,
      endpoint: this.paramsMapper(options?.params || this.params),
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    const newInstance = new Emitter<NewPayload, Response, Endpoint, AdapterType, MapperData, Params, Data>(
      this.socket,
      this.emitterOptions,
      json,
      mapperFn,
    );
    newInstance.connections = this.connections;
    return newInstance;
  }

  getAck = (ack?: EmitterAcknowledgeType<any, AdapterType>) => {
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

  emit: EmitType<this> = ({
    data,
    params,
    options,
    ack,
  }: {
    data?: Payload;
    params?: ExtractRouteParams<Endpoint>;
    options?: Partial<EmitterOptionsType<Endpoint, AdapterType>>;
    ack?: EmitterAcknowledgeType<any, AdapterType>;
  } = {}) => {
    const instance = this.clone({ ...options, data, params });

    const eventMessageId = getUniqueRequestId(instance.endpoint);

    this.socket.adapter.emit(eventMessageId, instance, instance.getAck(ack));
    return eventMessageId;
  };
}
