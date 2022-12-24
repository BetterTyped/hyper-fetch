export type UseEventMessagesOptionsType<ResponsesType> = {
  dependencyTracking?: boolean;
  filter?: ((data: ResponsesType, event: MessageEvent<ResponsesType>) => boolean) | string[];
};
