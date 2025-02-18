import { Time, ExtractRouteParams, ParamsType, PayloadMapperType, EmptyTypes } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { emitEvent, EmitOptionsType, EmitterConfigurationType, EmitterOptionsType, EmitType } from "emitter";
import { ExtractAdapterEmitterOptionsType, ExtractSocketAdapterType } from "types";

export class Emitter<
  Payload,
  Topic extends string,
  Socket extends SocketInstance,
  HasPayload extends boolean = false,
  HasParams extends boolean = false,
> {
  readonly topic: Topic;
  params?: ParamsType;
  timeout: number;
  payload: Payload | undefined;
  adapterOptions: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>> | undefined;
  payloadMapper?: PayloadMapperType<any>;

  constructor(
    readonly socket: Socket,
    readonly options: EmitterOptionsType<Topic, ExtractSocketAdapterType<Socket>>,
    /**
     * Used to recreate the emitter with the same state
     * @internal
     */
    snapshot?: Partial<Emitter<Payload, Topic, Socket, any, any>>,
  ) {
    const { topic, timeout = Time.SEC * 2, adapterOptions } = options;

    this.topic = snapshot?.topic ?? topic;
    this.payload = snapshot?.payload;
    this.timeout = snapshot?.timeout ?? timeout;
    this.adapterOptions = snapshot?.adapterOptions ?? adapterOptions;
    this.params = snapshot?.params;
  }

  setOptions(adapterOptions: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>> | undefined) {
    return this.clone({ adapterOptions });
  }

  setTimeout(timeout: number) {
    return this.clone({ timeout });
  }

  setPayload = <D extends Payload>(payload: D) => {
    return this.clone<D, D extends EmptyTypes ? false : true, HasParams>({
      payload,
    });
  };

  setPayloadMapper = <DataMapper extends (payload: Payload) => any | Promise<any>>(payloadMapper: DataMapper) => {
    const cloned = this.clone<Payload, HasPayload, HasParams>(undefined);

    cloned.payloadMapper = payloadMapper;

    return cloned;
  };

  setParams(params: NonNullable<ExtractRouteParams<Topic>>) {
    return this.clone<Payload, HasPayload, true>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): Topic => {
    let topic = this.options.topic as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        topic = topic.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }

    return topic as Topic;
  };

  clone<
    NewPayload extends Payload = Payload,
    NewHasPayload extends boolean = HasPayload,
    NewHasParams extends boolean = HasParams,
  >(
    config?: EmitterConfigurationType<NewPayload, ExtractRouteParams<Topic>, Topic, Socket>,
  ): Emitter<NewPayload, Topic, Socket, NewHasPayload, NewHasParams> {
    const snapshot: Partial<Emitter<NewPayload, Topic, Socket, NewHasPayload, NewHasParams>> = {
      timeout: this.timeout,
      adapterOptions: this.adapterOptions,
      payload: this.payload as NewPayload,
      ...config,
      params: config?.params || this.params,
      topic: this.paramsMapper(config?.params || this.params),
    };

    const newInstance = new Emitter<NewPayload, Topic, Socket, NewHasPayload, NewHasParams>(
      this.socket,
      this.options,
      snapshot,
    );

    newInstance.payloadMapper = this.payloadMapper;

    return newInstance;
  }

  emit: EmitType<Emitter<Payload, Topic, Socket, HasPayload, HasParams>> = (options = {}) => {
    const typedOptions = options as EmitOptionsType<Emitter<Payload, Topic, Socket, HasPayload, HasParams>>;
    const instance = this.clone<Payload, HasPayload, HasParams>(typedOptions);

    emitEvent(instance);
  };
}
