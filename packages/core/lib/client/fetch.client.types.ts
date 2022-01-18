import { FetchCommand, FetchCommandInstance } from "command";

// Client

export type ClientType<ErrorType, ClientOptions> = <RequestErrorType = undefined>(
  command: FetchCommand<any, any, any, ErrorType, RequestErrorType, any, ClientOptions, any, any, any>,
  options?: FetchClientOptions,
) => Promise<ClientResponseType<any, ErrorType & RequestErrorType>>;

export type FetchClientXHR = Partial<XMLHttpRequest>;
export type FetchClientOptions = {
  queryParams?: QueryStringifyOptions;
  headerMapper?: <T extends FetchCommandInstance>(command: T, xhr: XMLHttpRequest) => void;
};

// Responses

export type ClientResponseType<GenericDataType, GenericErrorType> = [
  GenericDataType | null,
  GenericErrorType | null,
  number | null,
];
export type ClientResponseSuccessType<GenericDataType> = [GenericDataType, null, number | null];
export type ClientResponseErrorType<GenericErrorType> = [null, GenericErrorType, number | null];

// QueryParams

export type ClientQueryParamValues = number | string | boolean | null | undefined;
export type ClientQueryParam =
  | ClientQueryParamValues
  | Array<ClientQueryParamValues>
  | Record<string, ClientQueryParamValues>;

export type ClientQueryParamsType = Record<string, ClientQueryParam>;

// Headers

export type ClientHeadersProps = {
  isFormData: boolean;
  headers: HeadersInit | undefined;
};

// Stringify

export type QueryStringifyOptions = {
  strict?: boolean;
  encode?: boolean;
  arrayFormat?: "bracket" | "index" | "comma" | "separator" | "bracket-separator" | "none";
  arraySeparator?: string;
  skipNull?: boolean;
  skipEmptyString?: boolean;
};

// Progress

export type FetchProgressType = {
  progress: number;
  timeLeft: number;
  sizeLeft: number;
};
