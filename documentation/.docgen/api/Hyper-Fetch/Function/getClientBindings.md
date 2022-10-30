
      
# getClientBindings

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getClientBindings(cmd, requestId)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [client/fetch.client.bindings.ts:5](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/client/fetch.client.bindings.ts#L5)

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr param-data="cmd"><td>

**cmd**

</td><td>

`CommandInstance`

</td><td>



</td></tr><tr param-data="requestId"><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
Promise<{ config: any; createAbortListener: <T>(callback: () => void, resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => () => void; fullUrl: string; getAbortController: () => AbortController; getRequestStartTimestamp: () => number; getResponseStartTimestamp: () => number; headers: HeadersInit; onAbortError: <T>(resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; onBeforeRequest: () => void; onError: <T>(error: Error | ExtractError<T>, status: number, resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; onRequestEnd: () => number; onRequestProgress: (progress: ProgressRequestDataType) => number; onRequestStart: (progress?: ProgressRequestDataType) => number; onResponseEnd: () => number; onResponseProgress: (progress: ProgressRequestDataType) => number; onResponseStart: (progress?: ProgressRequestDataType) => number; onSuccess: <T>(responseData: unknown, status: number, resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseSuccessType<ExtractResponse<T>>>; onTimeoutError: <T>(resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; onUnexpectedError: <T>(resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; payload: string | FormData }>
```

</div>