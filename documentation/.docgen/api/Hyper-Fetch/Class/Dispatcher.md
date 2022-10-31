

# Dispatcher

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { Dispatcher } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Dispatcher class was made to store controlled request Fetches, and firing them all-at-once or one-by-one in command queue.
Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:25](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L25)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="builder"><td class="api-docs__param-name required">

### builder 

`Required`

</td><td class="api-docs__param-type">

`BuilderInstance`

</td></tr><tr param-data="options"><td class="api-docs__param-name optional">

### options 

`Optional`

</td><td class="api-docs__param-type">

`DispatcherOptionsType`

</td></tr></tbody></table></div><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="builder"><h3 class="api-docs__name">

### `builder`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:35](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L35)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
BuilderInstance
```

</div><hr/></div><div class="api-docs__property" property-data="emitter"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:26](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L26)

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

Defined in [dispatcher/dispatcher.ts:27](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L27)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
{ onDrained: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueChange: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueStatus: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; setDrained: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueChanged: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueStatus: <Command>(queueKey: string, values: DispatcherData<Command>) => void }
```

</div><hr/></div><div class="api-docs__property" property-data="options"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:35](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L35)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
DispatcherOptionsType
```

</div><hr/></div><div class="api-docs__property" property-data="storage"><h3 class="api-docs__name">

### `storage`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:28](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L28)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
DispatcherStorageType
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="add"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:401](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L401)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
string
```

</div><hr/></div><div class="api-docs__method" method-data="addQueueElement"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:137](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L137)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="dispatcherDump"><td class="api-docs__param-name required">

#### dispatcherDump 

`Required`

</td><td class="api-docs__param-type">

`DispatcherDumpValueType<Command>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="addRunningRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:298](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L298)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

#### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="cancelRunningRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:331](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L331)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

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

</div><hr/></div><div class="api-docs__method" method-data="cancelRunningRequests"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:322](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L322)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="clear"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:223](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L223)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="clearQueue"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:162](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L162)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
{
  requests: any[];
  stopped: boolean;
};

```

</div><hr/></div><div class="api-docs__method" method-data="createStorageElement"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:380](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L380)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`Command`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

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
      options: ClientOptions | T extends Command ? O : never;
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
};

```

</div><hr/></div><div class="api-docs__method" method-data="delete"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:445](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L445)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="requestId"><td class="api-docs__param-name required">

#### requestId 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="abortKey"><td class="api-docs__param-name required">

#### abortKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
{
  requests: [object Object][];
  stopped: boolean;
};

```

</div><hr/></div><div class="api-docs__method" method-data="deleteRunningRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:353](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L353)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

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

</div><hr/></div><div class="api-docs__method" method-data="deleteRunningRequests"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:346](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L346)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="flush"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:207](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L207)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise
```

</div><hr/></div><div class="api-docs__method" method-data="flushQueue"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:177](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L177)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise
```

</div><hr/></div><div class="api-docs__method" method-data="getAllRunningRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:276](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L276)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
[object Object][]
```

</div><hr/></div><div class="api-docs__method" method-data="getIsActiveQueue"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:127](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L127)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
boolean
```

</div><hr/></div><div class="api-docs__method" method-data="getQueue"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:107](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L107)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
{
  requests: [object Object][];
  stopped: boolean;
};

```

</div><hr/></div><div class="api-docs__method" method-data="getQueueRequestCount"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:364](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L364)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
number
```

</div><hr/></div><div class="api-docs__method" method-data="getQueuesKeys"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:100](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L100)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
string[]
```

</div><hr/></div><div class="api-docs__method" method-data="getRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:117](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L117)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

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
      options: ClientOptions | T extends Command ? O : never;
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
};

```

</div><hr/></div><div class="api-docs__method" method-data="getRunningRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:290](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L290)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

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
{
  command: Command;
  requestId: string;
};

```

</div><hr/></div><div class="api-docs__method" method-data="getRunningRequests"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:283](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L283)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
[object Object][]
```

</div><hr/></div><div class="api-docs__method" method-data="hasRunningRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:314](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L314)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

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
boolean
```

</div><hr/></div><div class="api-docs__method" method-data="hasRunningRequests"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:307](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L307)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
boolean
```

</div><hr/></div><div class="api-docs__method" method-data="incrementQueueRequestCount"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:371](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L371)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="pause"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:73](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L73)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="performRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:478](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L478)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="storageElement"><td class="api-docs__param-name required">

#### storageElement 

`Required`

</td><td class="api-docs__param-type">

`DispatcherDumpValueType<CommandInstance>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise
```

</div><hr/></div><div class="api-docs__method" method-data="setQueue"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:149](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L149)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr><tr param-data="queue"><td class="api-docs__param-name required">

#### queue 

`Required`

</td><td class="api-docs__param-type">

`DispatcherData<Command>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
{
  requests: [object Object][];
  stopped: boolean;
};

```

</div><hr/></div><div class="api-docs__method" method-data="start"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:59](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L59)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="startRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:241](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L241)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

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

</div><hr/></div><div class="api-docs__method" method-data="stop"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:85](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L85)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="stopRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.ts:258](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/dispatcher/dispatcher.ts#L258)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queueKey"><td class="api-docs__param-name required">

#### queueKey 

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