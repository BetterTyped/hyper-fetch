
      
# CommandManager

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

**Command Manager** is used to emit 
`command lifecycle events`
 like - request start, request end, upload and download progress.
It is also the place of 
`request aborting`
 system, here we store all the keys and controllers that are isolated for each builder instance.

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L9)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><div class="api-docs__property"><h3 class="api-docs__name">

### `events`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L11)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
{ emitAbort: (abortKey: string, requestId: string, command: CommandInstance) => void; emitDownloadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void; emitLoading: (queueKey: string, requestId: string, values: CommandLoadingEventType) => void; emitRemove: <T>(queueKey: string, requestId: string, details: CommandEventDetails<T>) => void; emitRequestStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void; emitResponse: (cacheKey: string, requestId: string, response: ClientResponseType<unknown, unknown>, details: CommandResponseDetails) => void; emitResponseStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void; emitUploadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void; onAbort: (abortKey: string, callback: (command: CommandInstance) => void) => VoidFunction; onAbortById: (requestId: string, callback: (command: CommandInstance) => void) => VoidFunction; onDownloadProgress: <T>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onDownloadProgressById: <T>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onLoading: (queueKey: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction; onLoadingById: (requestId: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction; onRemove: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRemoveById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRequestStart: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRequestStartById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onResponse: <ResponseType, ErrorType>(cacheKey: string, callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void) => VoidFunction; onResponseById: <ResponseType, ErrorType>(requestId: string, callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void) => VoidFunction; onResponseStart: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onResponseStartById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onUploadProgress: <T>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onUploadProgressById: <T>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction }
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L10)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EventEmitter
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `abortControllers`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L13)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Map<string, Map<string, AbortController>>
```

</div><hr/></div></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `abortAll()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
abortAll()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L59)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `abortByKey()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
abortByKey(abortKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L44)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**abortKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `abortByRequestId()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
abortByRequestId(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L55)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**abortKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `addAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
addAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L15)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**abortKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L29)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**abortKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
AbortController
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `removeAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
removeAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L33)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**abortKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `useAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
useAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/command/command.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/command/command.manager.ts#L39)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**abortKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>