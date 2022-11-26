export type UseMessagesOptionsType<ResponsesType> = {
  dependencyTracking?: boolean;
  filter?: ((event: MessageEvent<ResponsesType>) => boolean) | string[];
};
