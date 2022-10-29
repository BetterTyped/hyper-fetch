
      
# Dispatcher

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

Dispatcher class was made to store controlled request Fetches, and firing them all-at-once or one-by-one in command queue.
Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.

</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">DispatcherOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>storage</th><th><code><span class="api-type__type ">DispatcherStorageType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">DispatcherOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>events</th><th><code><span class="api-type__symbol">&#123; </span><span>onDrained<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onQueueChange<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onQueueStatus<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>setDrained<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>setQueueChanged<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>setQueueStatus<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol"> &#125;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>emitter</th><th><code><span class="api-type__type ">EventEmitter</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `add()`

</h3><div class="api-docs__call-preview">

```tsx
add(command)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add command to the dispatcher handler

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `string`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `addQueueElement()`

</h3><div class="api-docs__call-preview">

```tsx
addQueueElement<Command>(queueKey, dispatcherDump)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add new element to storage

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>dispatcherDump</th><th><code><span class="api-type__type ">DispatcherDumpValueType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">Command</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `addRunningRequest()`

</h3><div class="api-docs__call-preview">

```tsx
addRunningRequest(queueKey, requestId, command)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add request to the running requests list

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `cancelRunningRequest()`

</h3><div class="api-docs__call-preview">

```tsx
cancelRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Cancel started request, but do NOT remove it from main storage

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `cancelRunningRequests()`

</h3><div class="api-docs__call-preview">

```tsx
cancelRunningRequests(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Cancel all started requests, but do NOT remove it from main storage

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `clear()`

</h3><div class="api-docs__call-preview">

```tsx
clear()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Clear all running requests and storage

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `clearQueue()`

</h3><div class="api-docs__call-preview">

```tsx
clearQueue(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Clear requests from queue cache

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `{ requests: any[]; stopped: boolean }`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `createStorageElement()`

</h3><div class="api-docs__call-preview">

```tsx
createStorageElement<Command>(command)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Create storage element from command

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">Command</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `DispatcherDumpValueType<Command>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `delete()`

</h3><div class="api-docs__call-preview">

```tsx
delete(queueKey, requestId, abortKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete from the storage and cancel request

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `DispatcherData<CommandInstance>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `deleteRunningRequest()`

</h3><div class="api-docs__call-preview">

```tsx
deleteRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete request by id, but do NOT clear it from queue and do NOT cancel them

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `deleteRunningRequests()`

</h3><div class="api-docs__call-preview">

```tsx
deleteRunningRequests(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete all started requests, but do NOT clear it from queue and do NOT cancel them

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `flush()`

</h3><div class="api-docs__call-preview">

```tsx
flush()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Flush all available requests from all queues

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `Promise<void>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `flushQueue()`

</h3><div class="api-docs__call-preview">

```tsx
flushQueue(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method used to flush the queue requests

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Promise<void>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getAllRunningRequest()`

</h3><div class="api-docs__call-preview">

```tsx
getAllRunningRequest()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get currently running requests from all queueKeys

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `RunningRequestValueType[]`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getIsActiveQueue()`

</h3><div class="api-docs__call-preview">

```tsx
getIsActiveQueue(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get value of the active queue status based on the stopped status

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `boolean`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getQueue()`

</h3><div class="api-docs__call-preview">

```tsx
getQueue<Command>(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Return queue state object

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `DispatcherData<Command>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getQueueRequestCount()`

</h3><div class="api-docs__call-preview">

```tsx
getQueueRequestCount(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get count of requests from the same queueKey

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `number`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getQueuesKeys()`

</h3><div class="api-docs__call-preview">

```tsx
getQueuesKeys()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Return all

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `string[]`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getRequest()`

</h3><div class="api-docs__call-preview">

```tsx
getRequest<Command>(queueKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Return request from queue state

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `DispatcherDumpValueType<Command>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getRunningRequest()`

</h3><div class="api-docs__call-preview">

```tsx
getRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get running request by id

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `RunningRequestValueType`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getRunningRequests()`

</h3><div class="api-docs__call-preview">

```tsx
getRunningRequests(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get currently running requests

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `RunningRequestValueType[]`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `hasRunningRequest()`

</h3><div class="api-docs__call-preview">

```tsx
hasRunningRequest(queueKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Check if request is currently processing

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `boolean`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `hasRunningRequests()`

</h3><div class="api-docs__call-preview">

```tsx
hasRunningRequests(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get the value based on the currently running requests

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `boolean`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `incrementQueueRequestCount()`

</h3><div class="api-docs__call-preview">

```tsx
incrementQueueRequestCount(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add request count to the queueKey

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `pause()`

</h3><div class="api-docs__call-preview">

```tsx
pause(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Pause request queue, but not cancel already started requests

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `performRequest()`

</h3><div class="api-docs__call-preview">

```tsx
performRequest(storageElement)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Request can run for some time, once it&#x27;s done, we have to check if it&#x27;s successful or if it was aborted
It can be different once the previous call was set as cancelled and removed from queue before this request got resolved

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>storageElement</th><th><code><span class="api-type__type ">DispatcherDumpValueType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">CommandInstance</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Promise<void | DispatcherData<CommandInstance>>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setQueue()`

</h3><div class="api-docs__call-preview">

```tsx
setQueue<Command>(queueKey, queue)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set new queue storage value

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>queue</th><th><code><span class="api-type__type ">DispatcherData</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">Command</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `DispatcherData<Command>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `start()`

</h3><div class="api-docs__call-preview">

```tsx
start(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Start request handling by queueKey

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `startRequest()`

</h3><div class="api-docs__call-preview">

```tsx
startRequest(queueKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Start particular request

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `stop()`

</h3><div class="api-docs__call-preview">

```tsx
stop(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Stop request queue and cancel all started requests - those will be treated like not started

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `stopRequest()`

</h3><div class="api-docs__call-preview">

```tsx
stopRequest(queueKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Stop particular request

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div></div>