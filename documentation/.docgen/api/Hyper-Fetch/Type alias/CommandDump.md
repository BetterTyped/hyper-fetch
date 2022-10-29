
      
# CommandDump

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type CommandDump = {
  abortKey: string; 
  auth: boolean; 
  cache: boolean; 
  cacheKey: string; 
  cacheTime: number; 
  cancelable: boolean; 
  commandOptions: CommandConfig<string, ClientOptions | ExtractClientOptions<Command>>; 
  data: CommandData<ExtractRequestData<Command>, unknown>; 
  deduplicate: boolean; 
  deduplicateTime: number; 
  disableRequestInterceptors: boolean | undefined; 
  disableResponseInterceptors: boolean | undefined; 
  effectKey: string; 
  endpoint: string; 
  headers: HeadersInit; 
  method: HttpMethodsType; 
  offline: boolean; 
  options: ClientOptions | ExtractClientOptions<Command>; 
  params: Params | NegativeTypes; 
  queryParams: QueryParamsType | NegativeTypes; 
  queueKey: string; 
  queued: boolean; 
  retry: number; 
  retryTime: number; 
  updatedAbortKey: boolean; 
  updatedCacheKey: boolean; 
  updatedEffectKey: boolean; 
  updatedQueueKey: boolean; 
  used: boolean; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

Dump of the command used to later recreate it

</span></div>