
      
# CommandConfig

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

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

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Configuration options for command creation

</span></div><div class="api-docs__definition">

Defined in [command/command.types.ts:76](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/command/command.types.ts#L76)

</div>