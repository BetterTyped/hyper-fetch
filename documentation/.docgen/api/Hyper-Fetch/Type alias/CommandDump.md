

# CommandDump

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CommandDump } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Dump of the command used to later recreate it

</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/core/src/command/command.types.ts#L33)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type CommandDump<Command,ClientOptions,QueryParamsType,Params> = {
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

</div>