
      
# Builder

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

**Builder** is a class that allows you to configure the connection with the server and then use it to create
commands which, when called using the appropriate method, will cause the server to be queried for the endpoint and
method specified in the command.

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L35)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>options</th><th><code><span class="api-type__type ">BuilderConfig</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><div class="api-docs__property"><h3 class="api-docs__name">

### `submitDispatcher`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L56)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Dispatcher
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `stringifyQueryParams`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to stringify query params from objects.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L73)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
StringifyCallbackType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `requestConfig`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L62)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
(command: CommandInstance) => RequestConfigType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `queryParamsConfig`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L66)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
QueryStringifyOptions
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `payloadMapper`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to get request data and transform them to the required format. It handles FormData and JSON by default.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L82)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ClientPayloadMappingCallback
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L87)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
BuilderConfig
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `loggerManager`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L50)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
LoggerManager
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `logger`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L85)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
LoggerType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `isNodeJS`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L37)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `headerMapper`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L78)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ClientHeaderMappingCallback
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `fetchDispatcher`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L55)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Dispatcher
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `effects`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L59)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
FetchEffectInstance[]
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `debug`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L38)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `commandManager`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L48)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CommandManager
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `commandConfig`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L63)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
(commandOptions: CommandConfig<string, RequestConfigType>) => Partial<CommandConfig<string, RequestConfigType>>
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `client`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L53)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ClientType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `cache`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L54)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Cache
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `baseUrl`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L36)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `appManager`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L49)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
AppManager
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `__onAuthCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L44)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
RequestInterceptorCallback[]
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `__onErrorCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L41)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ResponseInterceptorCallback<any, any>[]
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `__onRequestCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L45)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
RequestInterceptorCallback[]
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `__onResponseCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L43)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ResponseInterceptorCallback<any, any>[]
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `__onSuccessCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L42)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ResponseInterceptorCallback<any, any>[]
```

</div><hr/></div></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `addEffect()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
addEffect(effect)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Add persistent effects which trigger on the request lifecycle

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L224)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>effect</th><th><code><span class="api-type__type ">FetchEffectInstance</span><span class="api-type__symbol"> | </span><span class="api-type__type ">FetchEffectInstance</span><span class="api-type__symbol">[]</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
this
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

Clears the builder instance and remove all listeners on it&#x27;s dependencies

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L264)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `createCommand()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
createCommand<ResponseType, RequestDataType, LocalErrorType, QueryParamsType>()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Create commands based on the builder setup

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L243)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
<EndpointType>(params: CommandConfig<EndpointType, RequestConfigType>) => Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, RequestConfigType, false, false, false, undefined>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onAuth()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onAuth(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method of manipulating commands before sending the request. We can for example add custom header with token to the request which command had the auth set to true.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L178)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-type__type ">RequestInterceptorCallback</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onError()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onError<ErrorType>(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method for intercepting error responses. It can be used for example to refresh tokens.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L186)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-type__type ">ResponseInterceptorCallback</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">ErrorType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onRequest(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method of manipulating commands before sending the request.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L206)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-type__type ">RequestInterceptorCallback</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onResponse()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onResponse<ErrorType>(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method for intercepting any responses.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L214)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-type__type ">ResponseInterceptorCallback</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">ErrorType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onSuccess()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onSuccess<ErrorType>(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method for intercepting success responses.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L196)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-type__type ">ResponseInterceptorCallback</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">ErrorType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `removeEffect()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
removeEffect(effect)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Remove effects from builder

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L233)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>effect</th><th><code><span class="api-type__type">string</span><span class="api-type__symbol"> | </span><span class="api-type__type ">FetchEffectInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
this
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setClient()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setClient(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set custom http client to handle graphql, rest, firebase or other

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L170)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-docs__signature-symbol">(</span><span>builder<span class="api-docs__signature-symbol">: </span><span class="api-type__type ">BuilderInstance</span></span><span class="api-docs__signature-symbol">)</span><span class="api-docs__signature-symbol"> =&ampgt; </span><span class="api-type__type ">ClientType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setCommandConfig()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setCommandConfig(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

This method allows to configure global defaults for the command configuration like method, auth, deduplication etc.

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L103)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-docs__signature-symbol">(</span><span>command<span class="api-docs__signature-symbol">: </span><span class="api-type__type ">CommandInstance</span></span><span class="api-docs__signature-symbol">)</span><span class="api-docs__signature-symbol"> =&ampgt; </span><span class="api-type__type ">Partial</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">CommandConfig</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">string</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestConfigType</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setDebug()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setDebug(debug)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

This method enables the logger usage and display the logs in console

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L113)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>debug</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setHeaderMapper()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setHeaderMapper(headerMapper)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set the custom header mapping function

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L154)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>headerMapper</th><th><code><span class="api-type__type ">ClientHeaderMappingCallback</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setLogger()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setLogger(callback)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set the new logger instance to the builder

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L129)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>callback</th><th><code><span class="api-docs__signature-symbol">(</span><span>builder<span class="api-docs__signature-symbol">: </span><span class="api-type__type ">BuilderInstance</span></span><span class="api-docs__signature-symbol">)</span><span class="api-docs__signature-symbol"> =&ampgt; </span><span class="api-type__type ">LoggerManager</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setLoggerSeverity()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setLoggerSeverity(severity)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set the logger severity of the messages displayed to the console

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L121)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>severity</th><th><code><span class="api-type__type ">SeverityType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setPayloadMapper()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setPayloadMapper(payloadMapper)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set the request payload mapping function which get triggered before request get send

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L162)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>payloadMapper</th><th><code><span class="api-type__type ">ClientPayloadMappingCallback</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setQueryParamsConfig()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setQueryParamsConfig(queryParamsConfig)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set config for the query params stringify method, we can set here, among others, arrayFormat, skipNull, encode, skipEmptyString and more

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L137)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queryParamsConfig</th><th><code><span class="api-type__type ">QueryStringifyOptions</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setStringifyQueryParams()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setStringifyQueryParams(stringifyFn)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Set the custom query params stringify method to the builder

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L146)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>stringifyFn</th><th><code><span class="api-type__type ">StringifyCallbackType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">

Custom callback handling query params stringify

</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `__modifyAuth()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
__modifyAuth(command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Helper used by http client to apply the modifications on response error

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L286)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<CommandInstance>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `__modifyErrorResponse()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
__modifyErrorResponse(response, command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Private helper to run async on-error response processing

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L296)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<ClientResponseType<any, GlobalErrorType>>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `__modifyRequest()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
__modifyRequest(command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Private helper to run async pre-request processing

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L291)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<CommandInstance>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `__modifyResponse()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
__modifyResponse(response, command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Private helper to run async response processing

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L308)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<ClientResponseType<any, GlobalErrorType>>
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `__modifySuccessResponse()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
__modifySuccessResponse(response, command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Private helper to run async on-success response processing

</span></div><div class="api-docs__definition">

Defined in [builder/builder.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/builder/builder.ts#L302)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<ClientResponseType<any, GlobalErrorType>>
```

</div><hr/></div></div>