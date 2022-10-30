
      
# getClientBindings

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview fn" data-reactroot="">

```ts
getClientBindings(cmd, requestId)
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [client/fetch.client.bindings.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/client/fetch.client.bindings.ts#L5)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cmd</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Returns

</div><div class="api-docs__returns" data-reactroot="">

```ts
Promise<{ config: any; createAbortListener: <T>(callback: () => void, resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => () => void; fullUrl: string; getAbortController: () => AbortController; getRequestStartTimestamp: () => number; getResponseStartTimestamp: () => number; headers: HeadersInit; onAbortError: <T>(resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; onBeforeRequest: () => void; onError: <T>(error: Error | ExtractError<T>, status: number, resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; onRequestEnd: () => number; onRequestProgress: (progress: ProgressRequestDataType) => number; onRequestStart: (progress?: ProgressRequestDataType) => number; onResponseEnd: () => number; onResponseProgress: (progress: ProgressRequestDataType) => number; onResponseStart: (progress?: ProgressRequestDataType) => number; onSuccess: <T>(responseData: unknown, status: number, resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseSuccessType<ExtractResponse<T>>>; onTimeoutError: <T>(resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; onUnexpectedError: <T>(resolve: (value: ClientResponseErrorType<ExtractError<T>>) => void) => Promise<ClientResponseErrorType<ExtractError<T>>>; payload: string | FormData }>
```

</div>