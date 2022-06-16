import { CommandInstance, RequiredKeys } from "@better-typed/hyper-fetch";
import { UseFetchOptionsType } from "use-fetch";
declare type DefaultOptionsType = RequiredKeys<Omit<UseFetchOptionsType<CommandInstance>, "initialData">> & {
    initialData: null;
};
export declare const useFetchDefaultOptions: DefaultOptionsType;
export {};
