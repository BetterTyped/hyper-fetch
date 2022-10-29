
      
# Builder

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

**Builder** is a class that allows you to configure the connection with the server and then use it to create
commands which, when called using the appropriate method, will cause the server to be queried for the endpoint and
method specified in the command.

</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>options</th><th><code><span class="api-type__type ">BuilderConfig</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>submitDispatcher</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>stringifyQueryParams</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to stringify query params from objects.

</span></div></th></tr><tr><th>requestConfig</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>queryParamsConfig</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>payloadMapper</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to get request data and transform them to the required format. It handles FormData and JSON by default.

</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>loggerManager</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>logger</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>isNodeJS</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>headerMapper</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.

</span></div></th></tr><tr><th>fetchDispatcher</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>effects</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>debug</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandManager</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandConfig</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>client</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>cache</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>baseUrl</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>appManager</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>__onAuthCallbacks</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>__onErrorCallbacks</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>__onRequestCallbacks</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>__onResponseCallbacks</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>__onSuccessCallbacks</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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

</span></div><div class="api-docs__section">

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