

# DispatcherDumpValueType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { DispatcherDumpValueType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.types.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/dispatcher/dispatcher.types.ts#L13)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type DispatcherDumpValueType<Command> = {
  commandDump: CommandDump<Command>; 
  requestId: string; 
  retries: number; 
  stopped: boolean; 
  timestamp: number; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  commandDump: {
      abortKey: string;
      auth: boolean;
      cache: boolean;
      cacheKey: string;
      cacheTime: number;
      cancelable: boolean;
      commandOptions: {
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
      };
      data: MappedData extends undefined ? RequestDataType : MappedData | \null\ | \undefined\;
      deduplicate: boolean;
      deduplicateTime: number;
      disableRequestInterceptors: boolean | undefined;
      disableResponseInterceptors: boolean | undefined;
      effectKey: string;
      endpoint: string;
      headers: HeadersInit;
      method: GET | POST | PUT | PATCH | DELETE;
      offline: boolean;
      options: ClientOptions | T extends Command<any, any, any, any, any, any, infer O, any, any, any> ? O : never;
      params: Params | \null\ | \undefined\;
      queryParams: QueryParamsType | \null\ | \undefined\;
      queueKey: string;
      queued: boolean;
      retry: number;
      retryTime: number;
      updatedAbortKey: boolean;
      updatedCacheKey: boolean;
      updatedEffectKey: boolean;
      updatedQueueKey: boolean;
      used: boolean;
  };
  requestId: string;
  retries: number;
  stopped: boolean;
  timestamp: number;
}
```

</div>