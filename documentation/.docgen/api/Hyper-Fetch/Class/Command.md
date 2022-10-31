

# Command

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { Command } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Fetch command it is designed to prepare the necessary setup to execute the request to the server.
We can setup basic options for example endpoint, method, headers and advanced settings like cache, invalidation patterns, concurrency, retries and much, much more.
:::info Usage
We should not use this class directly in the standard development flow. We can initialize it using the 
`createCommand`
 method on the **Builder** class.
:::

</span></div><p class="api-docs__definition">

Defined in [command/command.ts:32](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L32)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="builder"><td class="api-docs__param-name required">

### builder 

`Required`

</td><td class="api-docs__param-type">

`Builder<GlobalErrorType, ClientOptions>`

</td></tr><tr param-data="commandOptions"><td class="api-docs__param-name required">

### commandOptions 

`Required`

</td><td class="api-docs__param-type">

`CommandConfig<EndpointType, ClientOptions>`

</td></tr><tr param-data="commandDump"><td class="api-docs__param-name optional">

### commandDump 

`Optional`

</td><td class="api-docs__param-type">

`CommandCurrentType<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, ClientOptions, MappedData>`

</td></tr><tr param-data="dataMapper"><td class="api-docs__param-name optional">

### dataMapper 

`Optional`

</td><td class="api-docs__param-type">

`(data: RequestDataType) => MappedData`

</td></tr></tbody></table></div><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="abortKey"><h3 class="api-docs__name">

### `abortKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:60](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L60)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property" property-data="auth"><h3 class="api-docs__name">

### `auth`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:47](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L47)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="builder"><h3 class="api-docs__name">

### `builder`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:74](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L74)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Builder<GlobalErrorType, ClientOptions>
```

</div><hr/></div><div class="api-docs__property" property-data="cache"><h3 class="api-docs__name">

### `cache`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:56](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L56)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="cacheKey"><h3 class="api-docs__name">

### `cacheKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:61](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L61)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property" property-data="cacheTime"><h3 class="api-docs__name">

### `cacheTime`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:57](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L57)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property" property-data="cancelable"><h3 class="api-docs__name">

### `cancelable`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:53](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L53)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="commandDump"><h3 class="api-docs__name">

### `commandDump`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:76](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L76)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CommandCurrentType<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, ClientOptions, MappedData>
```

</div><hr/></div><div class="api-docs__property" property-data="commandOptions"><h3 class="api-docs__name">

### `commandOptions`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:75](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L75)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CommandConfig<EndpointType, ClientOptions>
```

</div><hr/></div><div class="api-docs__property" property-data="data"><h3 class="api-docs__name">

### `data`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:50](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L50)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
MappedData extends undefined ? RequestDataType : MappedData
```

</div><hr/></div><div class="api-docs__property" property-data="deduplicate"><h3 class="api-docs__name">

### `deduplicate`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:65](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L65)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="deduplicateTime"><h3 class="api-docs__name">

### `deduplicateTime`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:66](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L66)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property" property-data="effectKey"><h3 class="api-docs__name">

### `effectKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:63](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L63)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property" property-data="endpoint"><h3 class="api-docs__name">

### `endpoint`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:45](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L45)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EndpointType
```

</div><hr/></div><div class="api-docs__property" property-data="headers"><h3 class="api-docs__name">

### `headers`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:46](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L46)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
HeadersInit
```

</div><hr/></div><div class="api-docs__property" property-data="method"><h3 class="api-docs__name">

### `method`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:48](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L48)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
HttpMethodsType
```

</div><hr/></div><div class="api-docs__property" property-data="offline"><h3 class="api-docs__name">

### `offline`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:59](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L59)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="options"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:52](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L52)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ClientOptions
```

</div><hr/></div><div class="api-docs__property" property-data="params"><h3 class="api-docs__name">

### `params`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:49](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L49)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ExtractRouteParams<EndpointType>
```

</div><hr/></div><div class="api-docs__property" property-data="queryParams"><h3 class="api-docs__name">

### `queryParams`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:51](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L51)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
QueryParamsType
```

</div><hr/></div><div class="api-docs__property" property-data="queueKey"><h3 class="api-docs__name">

### `queueKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:62](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L62)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property" property-data="queued"><h3 class="api-docs__name">

### `queued`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:58](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L58)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="retry"><h3 class="api-docs__name">

### `retry`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:54](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L54)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property" property-data="retryTime"><h3 class="api-docs__name">

### `retryTime`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:55](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L55)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property" property-data="used"><h3 class="api-docs__name">

### `used`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:64](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L64)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="dataMapper"><h3 class="api-docs__name">

### `dataMapper()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:87](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L87)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(data: RequestDataType) => MappedData
```

</div><hr/></div><div class="api-docs__method" method-data="exec"><h3 class="api-docs__name">

### `exec()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to use the command WITHOUT adding it to cache and queues. This mean it will make simple request without queue side effects.

</span></div><p class="api-docs__definition">

Defined in [command/command.ts:378](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L378)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
[object Object][data] extends any ? (options?: FetchType) => Promise : ([object Object][data] extends "null" | "undefined" ? ([object Object][params] extends "null" | "undefined" ? (options?: FetchType) => Promise : (options: FetchType) => Promise) : (options: FetchType) => Promise)
```

</div><hr/></div><div class="api-docs__method" method-data="send"><h3 class="api-docs__name">

### `send()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method used to perform requests with usage of cache and queues

</span></div><p class="api-docs__definition">

Defined in [command/command.ts:422](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L422)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
[object Object][data] extends any ? (options?: FetchType) => Promise : ([object Object][data] extends "null" | "undefined" ? ([object Object][params] extends "null" | "undefined" ? (options?: FetchType) => Promise : (options: FetchType) => Promise) : (options: FetchType) => Promise)
```

</div><hr/></div><div class="api-docs__method" method-data="abort"><h3 class="api-docs__name">

### `abort()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
abort()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:366](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L366)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="clone"><h3 class="api-docs__name">

### `clone()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
clone<D, P, Q, MapperData>(options, mapper)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:296](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L296)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="options"><td class="api-docs__param-name optional">

#### options 

`Optional`

</td><td class="api-docs__param-type">

`CommandCurrentType<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, ClientOptions, MapperData>`

</td></tr><tr param-data="mapper"><td class="api-docs__param-name optional">

#### mapper 

`Optional`

</td><td class="api-docs__param-type">

`(data: RequestDataType) => MapperData`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="dump"><h3 class="api-docs__name">

### `dump()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
dump()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:246](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L246)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
{
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

```

</div><hr/></div><div class="api-docs__method" method-data="setAbortKey"><h3 class="api-docs__name">

### `setAbortKey()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setAbortKey(abortKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:190](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L190)

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
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setAuth"><h3 class="api-docs__name">

### `setAuth()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setAuth(auth)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:143](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L143)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="auth"><td class="api-docs__param-name required">

#### auth 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setCache"><h3 class="api-docs__name">

### `setCache()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setCache(cache)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:178](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L178)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="cache"><td class="api-docs__param-name required">

#### cache 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setCacheKey"><h3 class="api-docs__name">

### `setCacheKey()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setCacheKey(cacheKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:195](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L195)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="cacheKey"><td class="api-docs__param-name required">

#### cacheKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setCacheTime"><h3 class="api-docs__name">

### `setCacheTime()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setCacheTime(cacheTime)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:182](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L182)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="cacheTime"><td class="api-docs__param-name required">

#### cacheTime 

`Required`

</td><td class="api-docs__param-type">

`number`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setCancelable"><h3 class="api-docs__name">

### `setCancelable()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setCancelable(cancelable)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:166](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L166)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="cancelable"><td class="api-docs__param-name required">

#### cancelable 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setData"><h3 class="api-docs__name">

### `setData()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setData(data)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:151](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L151)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="data"><td class="api-docs__param-name required">

#### data 

`Required`

</td><td class="api-docs__param-type">

`RequestDataType`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setDataMapper"><h3 class="api-docs__name">

### `setDataMapper()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setDataMapper<DataMapper>(mapper)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:226](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L226)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="mapper"><td class="api-docs__param-name required">

#### mapper 

`Required`

</td><td class="api-docs__param-type">

`(data: RequestDataType) => DataMapper`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setDeduplicate"><h3 class="api-docs__name">

### `setDeduplicate()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setDeduplicate(deduplicate)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:210](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L210)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="deduplicate"><td class="api-docs__param-name required">

#### deduplicate 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setDeduplicateTime"><h3 class="api-docs__name">

### `setDeduplicateTime()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setDeduplicateTime(deduplicateTime)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:214](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L214)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="deduplicateTime"><td class="api-docs__param-name required">

#### deduplicateTime 

`Required`

</td><td class="api-docs__param-type">

`number`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setEffectKey"><h3 class="api-docs__name">

### `setEffectKey()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setEffectKey(effectKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:205](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L205)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="effectKey"><td class="api-docs__param-name required">

#### effectKey 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setHeaders"><h3 class="api-docs__name">

### `setHeaders()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setHeaders(headers)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:139](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L139)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="headers"><td class="api-docs__param-name required">

#### headers 

`Required`

</td><td class="api-docs__param-type">

`HeadersInit`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setOffline"><h3 class="api-docs__name">

### `setOffline()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setOffline(offline)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:222](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L222)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="offline"><td class="api-docs__param-name required">

#### offline 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setOptions"><h3 class="api-docs__name">

### `setOptions()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setOptions(options)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:162](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L162)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="options"><td class="api-docs__param-name required">

#### options 

`Required`

</td><td class="api-docs__param-type">

`ClientOptions`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setParams"><h3 class="api-docs__name">

### `setParams()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setParams(params)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:147](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L147)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="params"><td class="api-docs__param-name required">

#### params 

`Required`

</td><td class="api-docs__param-type">

`ExtractRouteParams<EndpointType>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setQueryParams"><h3 class="api-docs__name">

### `setQueryParams()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setQueryParams(queryParams)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:158](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L158)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queryParams"><td class="api-docs__param-name required">

#### queryParams 

`Required`

</td><td class="api-docs__param-type">

`QueryParamsType`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setQueueKey"><h3 class="api-docs__name">

### `setQueueKey()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setQueueKey(queueKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:200](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L200)

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
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setQueued"><h3 class="api-docs__name">

### `setQueued()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setQueued(queued)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:186](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L186)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="queued"><td class="api-docs__param-name required">

#### queued 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setRetry"><h3 class="api-docs__name">

### `setRetry()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setRetry(retry)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:170](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L170)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="retry"><td class="api-docs__param-name required">

#### retry 

`Required`

</td><td class="api-docs__param-type">

`number`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setRetryTime"><h3 class="api-docs__name">

### `setRetryTime()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setRetryTime(retryTime)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:174](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L174)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="retryTime"><td class="api-docs__param-name required">

#### retryTime 

`Required`

</td><td class="api-docs__param-type">

`number`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div><div class="api-docs__method" method-data="setUsed"><h3 class="api-docs__name">

### `setUsed()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setUsed(used)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.ts:218](https://github.com/BetterTyped/hyper-fetch/blob/a5ae46b5/packages/core/src/command/command.ts#L218)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="used"><td class="api-docs__param-name required">

#### used 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command
```

</div><hr/></div></div>