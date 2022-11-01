

# CommandConfig

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CommandConfig } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Configuration options for command creation

</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:76](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/command/command.types.ts#L76)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type CommandConfig<GenericEndpoint,ClientOptions> = {
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

## Structure

</div><div class="api-docs__returns">

```ts
{
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
  method: GET | POST | PUT | PATCH | DELETE;
  offline: boolean;
  options: ClientOptions;
  queueKey: string;
  queued: boolean;
  retry: number;
  retryTime: number;
}
```

</div>