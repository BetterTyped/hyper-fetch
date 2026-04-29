import type { ExtractUrlParams, ParamsType, PayloadMapperType, EmptyTypes } from "@hyper-fetch/core";

import type { SocketInstance } from "socket";
import type { EmitMethodOptionsType, EmitterCloneOptionsType, EmitterOptionsType, EmitType } from "emitter";
import type { ExtractAdapterEmitterOptionsType, ExtractSocketAdapterType } from "types";

/**
 * Represents a socket message emitter bound to a specific topic. Use it to send typed payloads
 * over WebSocket or Server-Sent Events connections via the socket adapter.
 */
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

  /** Set adapter-specific emit options (e.g., acknowledgment, timeout). */
  setOptions(options: ExtractAdapterEmitterOptionsType<ExtractSocketAdapterType<Socket>> | undefined) {
    return this.clone({ options });
  }

  /** Set the message payload to be emitted. */
  setPayload = <D extends Payload>(payload: D) => {
    return this.clone<D, D extends EmptyTypes ? false : true, HasParams>({
      payload,
    });
  };

  /** Set a mapper function that transforms the payload before it is sent. */
  setPayloadMapper = <DataMapper extends (payload: Payload) => any | Promise<any>>(payloadMapper: DataMapper) => {
    const cloned = this.clone<Payload, HasPayload, HasParams>(undefined);

    cloned.unstable_payloadMapper = payloadMapper;

    return cloned;
  };

  /** Set the URL path parameters for the topic (e.g., `:channelId`). */
  setParams(params: NonNullable<ExtractUrlParams<Topic>>) {
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

  /** Create a new emitter instance with optional configuration overrides. */
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

  /** Send the message through the socket adapter on the configured topic. */
  emit: EmitType<Emitter<Payload, Topic, Socket, HasPayload, HasParams>> = (options = {}) => {
    const typedOptions = options as EmitMethodOptionsType<Emitter<Payload, Topic, Socket, HasPayload, HasParams>>;
    const instance = this.clone<Payload, HasPayload, HasParams>(typedOptions);

    this.socket.adapter.emit(instance);
  };
}
