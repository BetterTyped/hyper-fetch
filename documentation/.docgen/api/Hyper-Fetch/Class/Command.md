
      
# Command

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

Fetch command it is designed to prepare the necessary setup to execute the request to the server.
We can setup basic options for example endpoint, method, headers and advanced settings like cache, invalidation patterns, concurrency, retries and much, much more.
:::info Usage
We should not use this class directly in the standard development flow. We can initialize it using the 
`createCommand`
 method on the **Builder** class.
:::

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L32)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>builder</th><th><code><span class="api-type__type ">Builder</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandOptions</th><th><code><span class="api-type__type ">CommandConfig</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandDump</th><th><code><span class="api-type__type ">CommandCurrentType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol">, </span><span class="api-type__type ">QueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">LocalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">, </span><span class="api-type__type ">MappedData</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>dataMapper</th><th><code><span class="api-docs__signature-symbol">(</span><span>data<span class="api-docs__signature-symbol">: </span><span class="api-type__type ">RequestDataType</span></span><span class="api-docs__signature-symbol">)</span><span class="api-docs__signature-symbol"> =&ampgt; </span><span class="api-type__type ">MappedData</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><div class="api-docs__property"><h3 class="api-docs__name">

### `used`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L64)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `send`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method used to perform requests with usage of cache and queues

</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L422)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
FetchMethodType<Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>>
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `retryTime`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L55)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `retry`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L54)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `queued`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L58)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `queueKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L62)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `queryParams`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L51)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
QueryParamsType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `params`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L49)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ExtractRouteParams<EndpointType>
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L52)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ClientOptions
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `offline`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L59)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `method`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L48)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
HttpMethodsType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `headers`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L46)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
HeadersInit
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `exec`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to use the command WITHOUT adding it to cache and queues. This mean it will make simple request without queue side effects.

</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L378)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
FetchMethodType<Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>>
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `endpoint`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L45)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EndpointType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `effectKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L63)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `deduplicateTime`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L66)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `deduplicate`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L65)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `dataMapper`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L87)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
(data: RequestDataType) => MappedData
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `data`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L50)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
MappedData extends undefined ? RequestDataType : MappedData
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `commandOptions`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L75)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CommandConfig<EndpointType, ClientOptions>
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `commandDump`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L76)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CommandCurrentType<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType | LocalErrorType, EndpointType, ClientOptions, MappedData>
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `cancelable`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L53)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `cacheTime`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L57)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
number
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `cacheKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L61)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `cache`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L56)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `builder`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L74)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Builder<GlobalErrorType, ClientOptions>
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `auth`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L47)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `abortKey`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L60)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L366)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L296)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>options</th><th><code><span class="api-type__type ">CommandCurrentType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol">, </span><span class="api-type__type ">QueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">LocalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">, </span><span class="api-type__type ">MapperData</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>mapper</th><th><code><span class="api-docs__signature-symbol">(</span><span>data<span class="api-docs__signature-symbol">: </span><span class="api-type__type ">RequestDataType</span></span><span class="api-docs__signature-symbol">)</span><span class="api-docs__signature-symbol"> =&ampgt; </span><span class="api-type__type ">MapperData</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, D, P, Q, MapperData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L246)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
CommandDump<Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>, ClientOptions, QueryParamsType, ExtractRouteParams<EndpointType>>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L190)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L143)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>auth</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L178)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cache</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L195)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L182)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L166)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cancelable</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L151)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>data</th><th><code><span class="api-type__type ">RequestDataType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, true, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L226)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>mapper</th><th><code><span class="api-docs__signature-symbol">(</span><span>data<span class="api-docs__signature-symbol">: </span><span class="api-type__type ">RequestDataType</span></span><span class="api-docs__signature-symbol">)</span><span class="api-docs__signature-symbol"> =&ampgt; </span><span class="api-type__type ">DataMapper</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, DataMapper>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L210)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>deduplicate</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L214)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>deduplicateTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L205)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>effectKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L139)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>headers</th><th><code><span class="api-type__type ">HeadersInit</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L222)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>offline</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L162)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>options</th><th><code><span class="api-type__type ">ClientOptions</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, true, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L147)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>params</th><th><code><span class="api-type__type ">ExtractRouteParams</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, true, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L158)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queryParams</th><th><code><span class="api-type__type ">QueryParamsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, true, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L200)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L186)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queued</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L170)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>retry</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L174)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>retryTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [command/command.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.ts#L218)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>used</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>
```

</div><hr/></div></div>