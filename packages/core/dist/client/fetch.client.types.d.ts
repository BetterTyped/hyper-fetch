import { CommandInstance } from "command";
export declare type ClientType = (command: CommandInstance, requestId: string) => Promise<ClientResponseType<any, any>>;
export declare type ClientDefaultOptionsType = Partial<XMLHttpRequest>;
export declare type ClientPayloadMappingCallback = (data: unknown) => string | FormData;
export declare type ClientResponseType<GenericDataType, GenericErrorType> = [
    GenericDataType | null,
    GenericErrorType | null,
    number | null
];
export declare type ClientResponseSuccessType<GenericDataType> = [GenericDataType, null, number | null];
export declare type ClientResponseErrorType<GenericErrorType> = [null, GenericErrorType, number | null];
export declare type ClientQueryParamValues = number | string | boolean | null | undefined;
export declare type ClientQueryParam = ClientQueryParamValues | Array<ClientQueryParamValues> | Record<string, ClientQueryParamValues>;
export declare type ClientQueryParamsType = Record<string, ClientQueryParam>;
export declare type ClientHeaderMappingCallback = <T extends CommandInstance>(command: T) => HeadersInit;
export declare type ClientHeadersProps = {
    isFormData: boolean;
    headers: HeadersInit | undefined;
};
export declare type QueryStringifyOptions = {
    strict?: boolean;
    encode?: boolean;
    arrayFormat?: "bracket" | "index" | "comma" | "separator" | "bracket-separator" | "none";
    arraySeparator?: string;
    skipNull?: boolean;
    skipEmptyString?: boolean;
};
export declare type ProgressPayloadType = {
    total: number;
    loaded: number;
};
export declare type FetchProgressType = {
    progress: number;
    timeLeft: number | null;
    sizeLeft: number;
    total: number;
    loaded: number;
    startTimestamp: number;
};
