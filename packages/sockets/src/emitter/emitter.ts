import { ExtractRouteParams, ParamsType, PayloadMapperType, EmptyTypes } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { EmitMethodOptionsType, EmitterCloneOptionsType, EmitterOptionsType, EmitType } from "emitter";
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
  payload: Payload | undefined;
  options: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>> | undefined;
  /** @internal */
  unstable_payloadMapper?: PayloadMapperType<any>;

  constructor(
    readonly socket: Socket,
    readonly emitterOptions: EmitterOptionsType<Topic, ExtractSocketAdapterType<Socket>>,
    /**
     * Used to recreate the emitter with the same state
     * @internal
     */
    snapshot?: Partial<Emitter<Payload, Topic, Socket, any, any>>,
  ) {
    const { topic, options } = emitterOptions;

    this.topic = snapshot?.topic ?? topic;
    this.payload = snapshot?.payload;
    this.options = snapshot?.options ?? options;
    this.params = snapshot?.params;
  }

  setOptions(options: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>> | undefined) {
    return this.clone({ options });
  }

  setPayload = <D extends Payload>(payload: D) => {
    return this.clone<D, D extends EmptyTypes ? false : true, HasParams>({
      payload,
    });
  };

  setPayloadMapper = <DataMapper extends (payload: Payload) => any | Promise<any>>(payloadMapper: DataMapper) => {
    const cloned = this.clone<Payload, HasPayload, HasParams>(undefined);

    cloned.unstable_payloadMapper = payloadMapper;

    return cloned;
  };

  setParams(params: NonNullable<ExtractRouteParams<Topic>>) {
    return this.clone<Payload, HasPayload, true>({ params });
  }

  private paramsMapper = (params: ParamsType | null | undefined): Topic => {
    let topic = this.emitterOptions.topic as string;
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
    config?: EmitterCloneOptionsType<NewPayload, ParamsType, Topic, Socket>,
  ): Emitter<NewPayload, Topic, Socket, NewHasPayload, NewHasParams> {
    const snapshot: Partial<Emitter<Payload, Topic, Socket, NewHasPayload, NewHasParams>> = {
      options: this.options,
      payload: this.payload as unknown as Payload,
      ...config,
      params: config?.params || this.params,
      topic: this.paramsMapper(config?.params || this.params),
    };

    const newInstance = new Emitter<NewPayload, Topic, Socket, NewHasPayload, NewHasParams>(
      this.socket,
      this.emitterOptions,
      snapshot as Partial<Emitter<NewPayload, Topic, Socket, NewHasPayload, NewHasParams>>,
    );

    newInstance.unstable_payloadMapper = this.unstable_payloadMapper;

    return newInstance;
  }

  emit: EmitType<Emitter<Payload, Topic, Socket, HasPayload, HasParams>> = (options = {}) => {
    const typedOptions = options as EmitMethodOptionsType<Emitter<Payload, Topic, Socket, HasPayload, HasParams>>;
    const instance = this.clone<Payload, HasPayload, HasParams>(typedOptions);

    this.socket.adapter.emit(instance);
  };
}
