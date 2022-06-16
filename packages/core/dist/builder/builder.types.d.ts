import { Cache } from "cache";
import { CommandInstance } from "command";
import { Dispatcher } from "dispatcher";
import { ClientResponseType, ClientType, ClientQueryParamsType } from "client";
import { Builder } from "builder";
import { AppManager } from "managers";
import { NegativeTypes } from "types";
/**
 * Configuration setup for the builder
 */
export declare type BuilderConfig = {
    /**
     * Url to your server
     */
    baseUrl: string;
    /**
     * Custom client initialization prop
     */
    client?: ClientType;
    /**
     * Custom cache initialization prop
     */
    cache?: <B extends BuilderInstance>(builder: B) => Cache;
    /**
     * Custom app manager initialization prop
     */
    appManager?: <B extends BuilderInstance>(builder: B) => AppManager;
    /**
     * Custom fetch dispatcher initialization prop
     */
    fetchDispatcher?: <B extends BuilderInstance>(builder: B) => Dispatcher;
    /**
     * Custom submit dispatcher initialization prop
     */
    submitDispatcher?: <B extends BuilderInstance>(builder: B) => Dispatcher;
};
export declare type BuilderInstance = Builder<any, any>;
export declare type BuilderErrorType = Record<string, any> | string;
export declare type RequestInterceptorCallback = (command: CommandInstance) => Promise<CommandInstance> | CommandInstance;
export declare type ResponseInterceptorCallback = (response: ClientResponseType<any, any>, command: CommandInstance) => Promise<ClientResponseType<any, any>> | ClientResponseType<any, any>;
export declare type StringifyCallbackType = (queryParams: ClientQueryParamsType | string | NegativeTypes) => string;
