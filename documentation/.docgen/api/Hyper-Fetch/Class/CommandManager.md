

# CommandManager

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CommandManager } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

**Command Manager** is used to emit 
`command lifecycle events`
 like - request start, request end, upload and download progress.
It is also the place of 
`request aborting`
 system, here we store all the keys and controllers that are isolated for each builder instance.

</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:9](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L9)

</p><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="abortControllers"><h3 class="api-docs__name">

### `abortControllers`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L13)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Map<string, Map<string, AbortController>>
```

</div><hr/></div><div class="api-docs__property" property-data="emitter"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:10](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L10)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EventEmitter
```

</div><hr/></div><div class="api-docs__property" property-data="events"><h3 class="api-docs__name">

### `events`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:11](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L11)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
{ emitAbort: (abortKey: string, requestId: string, command: CommandInstance) => void; emitDownloadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void; emitLoading: (queueKey: string, requestId: string, values: CommandLoadingEventType) => void; emitRemove: <T>(queueKey: string, requestId: string, details: CommandEventDetails<T>) => void; emitRequestStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void; emitResponse: (cacheKey: string, requestId: string, response: ClientResponseType<unknown, unknown>, details: CommandResponseDetails) => void; emitResponseStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void; emitUploadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void; onAbort: (abortKey: string, callback: (command: CommandInstance) => void) => VoidFunction; onAbortById: (requestId: string, callback: (command: CommandInstance) => void) => VoidFunction; onDownloadProgress: <T>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onDownloadProgressById: <T>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onLoading: (queueKey: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction; onLoadingById: (requestId: string, callback: (values: CommandLoadingEventType) => void) => VoidFunction; onRemove: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRemoveById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRequestStart: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onRequestStartById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onResponse: <ResponseType,ErrorType>(cacheKey: string, callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void) => VoidFunction; onResponseById: <ResponseType,ErrorType>(requestId: string, callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void) => VoidFunction; onResponseStart: <T>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onResponseStartById: <T>(requestId: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction; onUploadProgress: <T>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction; onUploadProgressById: <T>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void) => VoidFunction }
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="abortAll"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:59](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L59)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="abortByKey"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:44](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L44)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="abortKey"><td class="api-docs__param-name required">

#### abortKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="abortByRequestId"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:55](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L55)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="abortKey"><td class="api-docs__param-name required">

#### abortKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

#### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="addAbortController"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:15](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L15)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="abortKey"><td class="api-docs__param-name required">

#### abortKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

#### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="getAbortController"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:29](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L29)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="abortKey"><td class="api-docs__param-name required">

#### abortKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

#### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
AbortController
```

</div><hr/></div><div class="api-docs__method" method-data="removeAbortController"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L33)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="abortKey"><td class="api-docs__param-name required">

#### abortKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

#### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="useAbortController"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.ts:39](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/command/command.manager.ts#L39)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="abortKey"><td class="api-docs__param-name required">

#### abortKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

#### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>