

# getClientBindings

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { getClientBindings } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [client/fetch.client.bindings.ts:5](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/client/fetch.client.bindings.ts#L5)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getClientBindings(cmd, requestId)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="cmd"><td class="api-docs__param-name required">

### cmd 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
Promise<{
  config: any;
  createAbortListener: (callback: () => void, resolve: (value: ClientResponseErrorType<T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>) => void) => () => void;
  fullUrl: string;
  getAbortController: () => AbortController;
  getRequestStartTimestamp: () => number;
  getResponseStartTimestamp: () => number;
  headers: HeadersInit;
  onAbortError: (resolve: (value: ClientResponseErrorType<T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>) => void) => Promise<[null, GenericErrorType, number | null]>;
  onBeforeRequest: () => void;
  onError: (error: Error | ExtractError<T>, status: number, resolve: (value: ClientResponseErrorType<T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>) => void) => Promise<[null, GenericErrorType, number | null]>;
  onRequestEnd: () => number;
  onRequestProgress: (progress: ProgressRequestDataType) => number;
  onRequestStart: (progress?: ProgressRequestDataType) => number;
  onResponseEnd: () => number;
  onResponseProgress: (progress: ProgressRequestDataType) => number;
  onResponseStart: (progress?: ProgressRequestDataType) => number;
  onSuccess: (responseData: unknown, status: number, resolve: (value: ClientResponseErrorType<T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>) => void) => Promise<[GenericDataType, null, number | null]>;
  onTimeoutError: (resolve: (value: ClientResponseErrorType<T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>) => void) => Promise<[null, GenericErrorType, number | null]>;
  onUnexpectedError: (resolve: (value: ClientResponseErrorType<T extends Command<any, any, any, infer G, infer L, any, any, any, any, any> ? G | L : never>) => void) => Promise<[null, GenericErrorType, number | null]>;
  payload: string | FormData;
}>
```

</div>