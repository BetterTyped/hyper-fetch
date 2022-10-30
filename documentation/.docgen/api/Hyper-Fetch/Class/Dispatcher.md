
      
# Dispatcher

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

Dispatcher class was made to store controlled request Fetches, and firing them all-at-once or one-by-one in command queue.
Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L25)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**builder**

</td><td>

`BuilderInstance`

</td><td>



</td></tr><tr><td>

**options**

</td><td>

`DispatcherOptionsType`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><div class="api-docs__property"><h3 class="api-docs__name">

### `storage`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L28)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
DispatcherStorageType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L35)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
DispatcherOptionsType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `events`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L27)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
{ onDrained: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueChange: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueStatus: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; setDrained: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueChanged: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueStatus: <Command>(queueKey: string, values: DispatcherData<Command>) => void }
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L26)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EventEmitter
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `builder`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L35)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
BuilderInstance
```

</div><hr/></div></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `add()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
add(command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add command to the dispatcher handler

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L401)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**command**

</td><td>

`CommandInstance`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
string
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `addQueueElement()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
addQueueElement<Command>(queueKey, dispatcherDump)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add new element to storage

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L137)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**dispatcherDump**

</td><td>

`DispatcherDumpValueType<Command>`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `addRunningRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
addRunningRequest(queueKey, requestId, command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add request to the running requests list

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L298)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**command**

</td><td>

`CommandInstance`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `cancelRunningRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
cancelRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Cancel started request, but do NOT remove it from main storage

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L331)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `cancelRunningRequests()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
cancelRunningRequests(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Cancel all started requests, but do NOT remove it from main storage

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L322)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `clear()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
clear()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Clear all running requests and storage

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L223)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `clearQueue()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
clearQueue(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Clear requests from queue cache

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L162)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
{ requests: any[]; stopped: boolean }
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `createStorageElement()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
createStorageElement<Command>(command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Create storage element from command

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L380)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**command**

</td><td>

`Command`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
DispatcherDumpValueType<Command>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `delete()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
delete(queueKey, requestId, abortKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete from the storage and cancel request

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L445)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**requestId**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**abortKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
DispatcherData<CommandInstance>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `deleteRunningRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
deleteRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete request by id, but do NOT clear it from queue and do NOT cancel them

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L353)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `deleteRunningRequests()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
deleteRunningRequests(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete all started requests, but do NOT clear it from queue and do NOT cancel them

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L346)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `flush()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
flush()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Flush all available requests from all queues

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L207)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<void>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `flushQueue()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
flushQueue(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method used to flush the queue requests

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L177)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<void>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getAllRunningRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getAllRunningRequest()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get currently running requests from all queueKeys

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L276)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
RunningRequestValueType[]
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getIsActiveQueue()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getIsActiveQueue(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get value of the active queue status based on the stopped status

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L127)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
boolean
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getQueue()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getQueue<Command>(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Return queue state object

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L107)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
DispatcherData<Command>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getQueueRequestCount()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getQueueRequestCount(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get count of requests from the same queueKey

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L364)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
number
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getQueuesKeys()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getQueuesKeys()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Return all

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L100)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
string[]
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getRequest<Command>(queueKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Return request from queue state

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L117)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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
DispatcherDumpValueType<Command>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getRunningRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get running request by id

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L290)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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
RunningRequestValueType
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getRunningRequests()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getRunningRequests(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get currently running requests

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L283)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
RunningRequestValueType[]
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `hasRunningRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
hasRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Check if request is currently processing

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L314)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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
boolean
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `hasRunningRequests()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
hasRunningRequests(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get the value based on the currently running requests

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L307)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
boolean
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `incrementQueueRequestCount()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
incrementQueueRequestCount(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add request count to the queueKey

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L371)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `pause()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
pause(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Pause request queue, but not cancel already started requests

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L73)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `performRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
performRequest(storageElement)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Request can run for some time, once it&#x27;s done, we have to check if it&#x27;s successful or if it was aborted
It can be different once the previous call was set as cancelled and removed from queue before this request got resolved

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L478)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**storageElement**

</td><td>

`DispatcherDumpValueType<CommandInstance>`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<void | DispatcherData<CommandInstance>>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setQueue()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setQueue<Command>(queueKey, queue)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set new queue storage value

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L149)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

</td><td>

`string`

</td><td>



</td></tr><tr><td>

**queue**

</td><td>

`DispatcherData<Command>`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
DispatcherData<Command>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `start()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
start(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Start request handling by queueKey

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L59)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `startRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
startRequest(queueKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Start particular request

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L241)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `stop()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
stop(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Stop request queue and cancel all started requests - those will be treated like not started

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L85)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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

### `stopRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
stopRequest(queueKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Stop particular request

</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.ts#L258)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**queueKey**

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