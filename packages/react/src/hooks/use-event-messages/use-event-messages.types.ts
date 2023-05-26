export type UseEventMessagesOptionsType<ResponsesType> = {
  dependencyTracking?: boolean;
  filter?: ((name: string, data: ResponsesType) => boolean) | string[];
};
