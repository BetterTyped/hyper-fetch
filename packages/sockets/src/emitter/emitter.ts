import { DateInterval, ExtractRouteParams, ParamsType, getUniqueRequestId } from "@hyper-fetch/core";

import { Socket } from "socket";
import { EmitterAcknowledgeType, EmitterOptionsType, EmitType } from "emitter";
import { SocketAdapterType, ExtractEmitterOptionsType } from "adapter";
import { ConnectMethodType } from "types";

export class Emitter<
  Payload,
  Response,
  Name extends string,
  AdapterType extends SocketAdapterType,
  MappedData = void,
  HasParams extends boolean = false,
  HasData extends boolean = false,
> {
  readonly name: Name;
  params?: ParamsType;
  timeout: number;
  data: Payload | null = null;
  options: ExtractEmitterOptionsType<AdapterType>;
  connections: Set<ConnectMethodType<AdapterType, Response>> = new Set();

  constructor(
    readonly socket: Socket<AdapterType>,
    readonly emitterOptions: EmitterOptionsType<Name, AdapterType>,
    json?: Partial<Emitter<Payload, Response, Name, AdapterType, MappedData>>,
    readonly dataMapper?: (data: Payload) => MappedData,
  ) {
    const { name, timeout = DateInterval.second * 2, options } = emitterOptions;

    this.name = json?.name ?? name;
    this.data = json?.data;
    this.timeout = json?.timeout ?? timeout;
    this.options = json?.options ?? options;
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

  setParams(params: ExtractRouteParams<Name>) {
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

  private paramsMapper = (params: ParamsType | null | undefined): Name => {
    let endpoint = this.emitterOptions.name as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return endpoint as Name;
  };

  clone<
    NewPayload = Payload,
    MapperData = MappedData,
    Params extends boolean = HasParams,
    Data extends boolean = HasData,
  >(
    options?: Partial<EmitterOptionsType<Name, AdapterType>> & { params?: ParamsType; data?: NewPayload },
    mapper?: (data: NewPayload) => MapperData,
  ) {
    const json: Partial<Emitter<NewPayload, Response, Name, AdapterType, MapperData, Params, Data>> = {
      timeout: this.timeout,
      options: this.options,
      data: this.data as unknown as NewPayload,
      ...options,
      name: this.paramsMapper(options?.params ? options?.params : this.params),
    };
    const mapperFn = (mapper || this.dataMapper) as typeof mapper;

    const newInstance = new Emitter<NewPayload, Response, Name, AdapterType, MapperData, Params, Data>(
      this.socket,
      this.emitterOptions,
      json,
      mapperFn,
    );
    newInstance.connections = this.connections;
    return newInstance;
  }

  emit: EmitType<this> = ({
    data,
    params,
    options,
    ack,
  }: {
    data?: Payload;
    params?: ExtractRouteParams<Name>;
    options?: Partial<EmitterOptionsType<Name, AdapterType>>;
    ack?: EmitterAcknowledgeType<any, AdapterType>;
  } = {}) => {
    const instance = this.clone({ ...options, data, params });

    const eventMessageId = getUniqueRequestId(instance.name);

    const action = (response: { data: any; extra: any; error: any }) => {
      instance.connections.forEach((connection) => connection(response, () => instance.connections.delete(connection)));
      return ack?.(response as any);
    };

    this.socket.adapter.emit(eventMessageId, instance, action);
    return eventMessageId;
  };
}
