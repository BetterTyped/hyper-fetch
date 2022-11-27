export type UseEventMessagesOptionsType<ResponsesType> = {
  dependencyTracking?: boolean;
  filter?: ((event: MessageEvent<ResponsesType>) => boolean) | string[];
};
