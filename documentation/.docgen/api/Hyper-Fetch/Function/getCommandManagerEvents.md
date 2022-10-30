
      
# getCommandManagerEvents

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview fn" data-reactroot="">

```ts
getCommandManagerEvents(emitter)
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [managers/command/command.manager.events.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.events.ts#L27)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**emitter**

</td><td>

`EventEmitter`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section" data-reactroot="">

## Returns

</div><div class="api-docs__returns" data-reactroot="">

```ts
{ emitAbort: (abortKey: string, requestId: string, command: CommandInstance) => void; emitDownloadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void; emitLoading: (queueKey: string, requestId: string, values: CommandLoadingEventType) => void; emitRemove: <T>(queueKey: string, requestId: string, details: CommandEventDetails<T>) => void; emitRequestStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void; emitResponse: (cacheKey: string, requestId: string, response: ClientResponseType<unknown, unknown>, details: CommandResponseDetails) => void; emitResponseStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void; emitUploadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void; onAbort: (abortKey: string, callback: (command: CommandInstance) => void) => VoidFunction; onAbortById: (requestId: string, callback: (command: CommandInstance) => void) => VoidFunction; onDownloadProgress: <T>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onDownloadProgressById: <T>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onLoading: (queueKey: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction; onLoadingById: (requestId: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction; onRemove: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRemoveById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRequestStart: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRequestStartById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onResponse: <ResponseType, ErrorType>(cacheKey: string, callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void) => VoidFunction; onResponseById: <ResponseType, ErrorType>(requestId: string, callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void) => VoidFunction; onResponseStart: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onResponseStartById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onUploadProgress: <T>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onUploadProgressById: <T>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction }
```

</div>