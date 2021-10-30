export type BuilderErrorMapperCallback = (errorResponse: any) => string;
export type BuilderHeadersCallback = () => HeadersInit | undefined;

export type FetchBuilderProps = {
  baseUrl: string;
};
