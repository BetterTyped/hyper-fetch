
      
# Cache

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

Cache class handles the data exchange with the dispatchers.

</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">CacheOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>storage</th><th><code><span class="api-type__type ">CacheStorageType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">CacheOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>lazyStorage</th><th><code><span class="api-type__type ">CacheAsyncStorageType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>garbageCollectors</th><th><code><span class="api-type__type ">Map</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">string</span><span class="api-type__symbol">, </span><span class="api-type__type ">Timeout</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>events</th><th><code><span class="api-type__symbol">&#123; </span><span>emitCacheData<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitRevalidation<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onData<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onRevalidate<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol"> &#125;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>emitter</th><th><code><span class="api-type__type ">EventEmitter</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>clearKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `clear()`

</h3><div class="api-docs__call-preview">

```tsx
clear()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Clear cache storages

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `Promise<void>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `delete()`

</h3><div class="api-docs__call-preview">

```tsx
delete(cacheKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete record from storages and trigger revalidation

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `get()`

</h3><div class="api-docs__call-preview">

```tsx
get<Response, Error>(cacheKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get particular record from storage by cacheKey. It will trigger lazyStorage to emit lazy load event for reading it&#x27;s data.

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `CacheValueType<Response, Error>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getLazyKeys()`

</h3><div class="api-docs__call-preview">

```tsx
getLazyKeys()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Used to receive keys from sync storage and lazy storage

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `Promise<string[]>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getLazyResource()`

</h3><div class="api-docs__call-preview">

```tsx
getLazyResource<Response, Error>(cacheKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Used to receive data from lazy storage

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Promise<CacheValueType<Response, Error>>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `keys()`

</h3><div class="api-docs__call-preview">

```tsx
keys()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get sync storage keys, lazyStorage keys will not be included

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `string[]`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `revalidate()`

</h3><div class="api-docs__call-preview">

```tsx
revalidate(cacheKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Revalidate cache by cacheKey or partial matching with RegExp

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span><span class="api-type__symbol"> | </span><span class="api-type__type ">RegExp</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Promise<void>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `scheduleGarbageCollector()`

</h3><div class="api-docs__call-preview">

```tsx
scheduleGarbageCollector(cacheKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Schedule garbage collection for given key

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Promise<void>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `set()`

</h3><div class="api-docs__call-preview">

```tsx
set<Response, Error>(command, response, details)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set the cache data to the storage

</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span><span class="api-type__symbol"> | </span><span class="api-type__type ">CommandDump</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">CommandInstance</span><span class="api-type__symbol">, </span><span class="api-type__type">unknown</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientQueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type">null</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">Response</span><span class="api-type__symbol">, </span><span class="api-type__type ">Error</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>details</th><th><code><span class="api-type__type ">CommandResponseDetails</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div></div>