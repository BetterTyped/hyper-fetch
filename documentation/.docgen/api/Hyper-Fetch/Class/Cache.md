

# Cache

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { Cache } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Cache class handles the data exchange with the dispatchers.

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:23](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L23)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="builder"><td class="api-docs__param-name required">

### builder 

`Required`

</td><td class="api-docs__param-type">

`BuilderInstance`

</td></tr><tr param-data="options"><td class="api-docs__param-name optional">

### options 

`Optional`

</td><td class="api-docs__param-type">

`CacheOptionsType`

</td></tr></tbody></table></div><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="builder"><h3 class="api-docs__name">

### `builder`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L33)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
BuilderInstance
```

</div><hr/></div><div class="api-docs__property" property-data="clearKey"><h3 class="api-docs__name">

### `clearKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:29](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L29)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property" property-data="emitter"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:24](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L24)

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

Defined in [cache/cache.ts:25](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L25)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
{ emitCacheData: <Response,Error>(cacheKey: string, data: CacheValueType<Response, Error>) => void; emitRevalidation: (cacheKey: string) => void; onData: <Response,Error>(cacheKey: string, callback: (data: CacheValueType<Response, Error>) => void) => VoidFunction; onRevalidate: (cacheKey: string, callback: () => void) => VoidFunction }
```

</div><hr/></div><div class="api-docs__property" property-data="garbageCollectors"><h3 class="api-docs__name">

### `garbageCollectors`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:30](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L30)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Map<string, Timeout>
```

</div><hr/></div><div class="api-docs__property" property-data="lazyStorage"><h3 class="api-docs__name">

### `lazyStorage`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:28](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L28)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CacheAsyncStorageType
```

</div><hr/></div><div class="api-docs__property" property-data="options"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L33)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CacheOptionsType
```

</div><hr/></div><div class="api-docs__property" property-data="storage"><h3 class="api-docs__name">

### `storage`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:27](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L27)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CacheStorageType
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="clear"><h3 class="api-docs__name">

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

Clear cache storages

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:218](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L218)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<void>
```

</div><hr/></div><div class="api-docs__method" method-data="delete"><h3 class="api-docs__name">

### `delete()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
delete(cacheKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Delete record from storages and trigger revalidation

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:119](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L119)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="cacheKey"><td class="api-docs__param-name required">

#### cacheKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="get"><h3 class="api-docs__name">

### `get()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
get<Response, Error>(cacheKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get particular record from storage by cacheKey. It will trigger lazyStorage to emit lazy load event for reading it&#x27;s data.

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:99](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L99)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="cacheKey"><td class="api-docs__param-name required">

#### cacheKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
{
  cacheTime: number;
  clearKey: string;
  data: [GenericDataType | null, GenericErrorType | null, number | null];
  details: {
      isCanceled: boolean;
      isFailed: boolean;
      isOffline: boolean;
      retries: number;
      timestamp: number;
  };
}
```

</div><hr/></div><div class="api-docs__method" method-data="getLazyKeys"><h3 class="api-docs__name">

### `getLazyKeys()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getLazyKeys()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Used to receive keys from sync storage and lazy storage

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:179](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L179)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<string[]>
```

</div><hr/></div><div class="api-docs__method" method-data="getLazyResource"><h3 class="api-docs__name">

### `getLazyResource()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getLazyResource<Response, Error>(cacheKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Used to receive data from lazy storage

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:152](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L152)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="cacheKey"><td class="api-docs__param-name required">

#### cacheKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<{
  cacheTime: number;
  clearKey: string;
  data: [GenericDataType | null, GenericErrorType | null, number | null];
  details: {
      isCanceled: boolean;
      isFailed: boolean;
      isOffline: boolean;
      retries: number;
      timestamp: number;
  };
}>
```

</div><hr/></div><div class="api-docs__method" method-data="keys"><h3 class="api-docs__name">

### `keys()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
keys()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Get sync storage keys, lazyStorage keys will not be included

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:109](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L109)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
string[]
```

</div><hr/></div><div class="api-docs__method" method-data="revalidate"><h3 class="api-docs__name">

### `revalidate()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
revalidate(cacheKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Revalidate cache by cacheKey or partial matching with RegExp

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:130](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L130)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="cacheKey"><td class="api-docs__param-name required">

#### cacheKey 

`Required`

</td><td class="api-docs__param-type">

`string | RegExp`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<void>
```

</div><hr/></div><div class="api-docs__method" method-data="scheduleGarbageCollector"><h3 class="api-docs__name">

### `scheduleGarbageCollector()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
scheduleGarbageCollector(cacheKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Schedule garbage collection for given key

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:192](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L192)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="cacheKey"><td class="api-docs__param-name required">

#### cacheKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<void>
```

</div><hr/></div><div class="api-docs__method" method-data="set"><h3 class="api-docs__name">

### `set()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
set<Response, Error>(command, response, details)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set the cache data to the storage

</span></div><p class="api-docs__definition">

Defined in [cache/cache.ts:61](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/cache/cache.ts#L61)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance | CommandDump<CommandInstance, unknown, ClientQueryParamsType, null>`

</td></tr><tr param-data="response"><td class="api-docs__param-name required">

#### response 

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<Response, Error>`

</td></tr><tr param-data="details"><td class="api-docs__param-name required">

#### details 

`Required`

</td><td class="api-docs__param-type">

`CommandResponseDetails`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>