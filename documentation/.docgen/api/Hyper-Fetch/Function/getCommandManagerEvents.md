

# getCommandManagerEvents

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { getCommandManagerEvents } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.events.ts:27](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.events.ts#L27)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getCommandManagerEvents(emitter)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="emitter"><td class="api-docs__param-name required">

### emitter 

`Required`

</td><td class="api-docs__param-type">

`EventEmitter`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
  emitAbort: (abortKey: string, requestId: string, command: CommandInstance) => void;
  emitDownloadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails) => void;
  emitLoading: (queueKey: string, requestId: string, values: CommandLoadingEventType) => void;
  emitRemove: (queueKey: string, requestId: string, details: CommandEventDetails) => void;
  emitRequestStart: (queueKey: string, requestId: string, details: CommandEventDetails) => void;
  emitResponse: (cacheKey: string, requestId: string, response: ClientResponseType, details: CommandResponseDetails) => void;
  emitResponseStart: (queueKey: string, requestId: string, details: CommandEventDetails) => void;
  emitUploadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails) => void;
  onAbort: (abortKey: string, callback: (command: CommandInstance) => void) => VoidFunction;
  onAbortById: (requestId: string, callback: (command: CommandInstance) => void) => VoidFunction;
  onDownloadProgress: (queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails) => void) => VoidFunction;
  onDownloadProgressById: (requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails) => void) => VoidFunction;
  onLoading: (queueKey: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction;
  onLoadingById: (requestId: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction;
  onRemove: (queueKey: string, callback: (details: CommandEventDetails) => void) => VoidFunction;
  onRemoveById: (requestId: string, callback: (details: CommandEventDetails) => void) => VoidFunction;
  onRequestStart: (queueKey: string, callback: (details: CommandEventDetails) => void) => VoidFunction;
  onRequestStartById: (requestId: string, callback: (details: CommandEventDetails) => void) => VoidFunction;
  onResponse: (cacheKey: string, callback: (response: ClientResponseType, details: CommandResponseDetails) => void) => VoidFunction;
  onResponseById: (requestId: string, callback: (response: ClientResponseType, details: CommandResponseDetails) => void) => VoidFunction;
  onResponseStart: (queueKey: string, callback: (details: CommandEventDetails) => void) => VoidFunction;
  onResponseStartById: (requestId: string, callback: (details: CommandEventDetails) => void) => VoidFunction;
  onUploadProgress: (queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails) => void) => VoidFunction;
  onUploadProgressById: (requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails) => void) => VoidFunction;
}
```

</div>