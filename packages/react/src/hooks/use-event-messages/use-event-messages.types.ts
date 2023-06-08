export type UseEventMessagesOptionsType<ResponsesType> = {
  dependencyTracking?: boolean;
  filter?: ((endpoint: string, data: ResponsesType) => boolean) | string[];
};
