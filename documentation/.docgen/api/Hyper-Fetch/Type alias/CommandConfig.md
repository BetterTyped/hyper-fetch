
      
# CommandConfig

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type CommandConfig = {
  abortKey: string; 
  auth: boolean; 
  cache: boolean; 
  cacheKey: string; 
  cacheTime: number; 
  cancelable: boolean; 
  deduplicate: boolean; 
  deduplicateTime: number; 
  disableRequestInterceptors: boolean; 
  disableResponseInterceptors: boolean; 
  effectKey: string; 
  endpoint: GenericEndpoint; 
  headers: HeadersInit; 
  method: HttpMethodsType; 
  offline: boolean; 
  options: ClientOptions; 
  queueKey: string; 
  queued: boolean; 
  retry: number; 
  retryTime: number; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

Configuration options for command creation

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [command/command.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.types.ts#L76)

</div>