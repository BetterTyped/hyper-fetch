

# Builder

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { Builder } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

**Builder** is a class that allows you to configure the connection with the server and then use it to create
commands which, when called using the appropriate method, will cause the server to be queried for the endpoint and
method specified in the command.

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:35](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L35)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="options"><td class="api-docs__param-name required">

### options 

`Required`

</td><td class="api-docs__param-type">

`BuilderConfig`

</td></tr></tbody></table></div><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="appManager"><h3 class="api-docs__name">

### `appManager`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:49](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L49)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
AppManager
```

</div><hr/></div><div class="api-docs__property" property-data="baseUrl"><h3 class="api-docs__name">

### `baseUrl`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:36](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L36)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
string
```

</div><hr/></div><div class="api-docs__property" property-data="cache"><h3 class="api-docs__name">

### `cache`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:54](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L54)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Cache
```

</div><hr/></div><div class="api-docs__property" property-data="commandManager"><h3 class="api-docs__name">

### `commandManager`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:48](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L48)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
CommandManager
```

</div><hr/></div><div class="api-docs__property" property-data="debug"><h3 class="api-docs__name">

### `debug`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:38](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L38)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="effects"><h3 class="api-docs__name">

### `effects`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:59](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L59)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
FetchEffectInstance[]
```

</div><hr/></div><div class="api-docs__property" property-data="fetchDispatcher"><h3 class="api-docs__name">

### `fetchDispatcher`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:55](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L55)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Dispatcher
```

</div><hr/></div><div class="api-docs__property" property-data="isNodeJS"><h3 class="api-docs__name">

### `isNodeJS`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:37](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L37)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="logger"><h3 class="api-docs__name">

### `logger`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:85](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L85)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
LoggerType
```

</div><hr/></div><div class="api-docs__property" property-data="loggerManager"><h3 class="api-docs__name">

### `loggerManager`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:50](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L50)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
LoggerManager
```

</div><hr/></div><div class="api-docs__property" property-data="options"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:87](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L87)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
BuilderConfig
```

</div><hr/></div><div class="api-docs__property" property-data="queryParamsConfig"><h3 class="api-docs__name">

### `queryParamsConfig`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:66](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L66)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
QueryStringifyOptions
```

</div><hr/></div><div class="api-docs__property" property-data="submitDispatcher"><h3 class="api-docs__name">

### `submitDispatcher`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:56](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L56)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
Dispatcher
```

</div><hr/></div><div class="api-docs__property" property-data="__onAuthCallbacks"><h3 class="api-docs__name">

### `__onAuthCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:44](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L44)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
RequestInterceptorCallback[]
```

</div><hr/></div><div class="api-docs__property" property-data="__onErrorCallbacks"><h3 class="api-docs__name">

### `__onErrorCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:41](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L41)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ResponseInterceptorCallback<any, any>[]
```

</div><hr/></div><div class="api-docs__property" property-data="__onRequestCallbacks"><h3 class="api-docs__name">

### `__onRequestCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:45](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L45)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
RequestInterceptorCallback[]
```

</div><hr/></div><div class="api-docs__property" property-data="__onResponseCallbacks"><h3 class="api-docs__name">

### `__onResponseCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:43](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L43)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ResponseInterceptorCallback<any, any>[]
```

</div><hr/></div><div class="api-docs__property" property-data="__onSuccessCallbacks"><h3 class="api-docs__name">

### `__onSuccessCallbacks`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:42](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L42)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
ResponseInterceptorCallback<any, any>[]
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="client"><h3 class="api-docs__name">

### `client()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:53](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L53)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(command: CommandInstance, requestId: string) => Promise<[GenericDataType | null, GenericErrorType | null, number | null]>
```

</div><hr/></div><div class="api-docs__method" method-data="commandConfig"><h3 class="api-docs__name">

### `commandConfig()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:63](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L63)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(commandOptions: CommandConfig<string, RequestConfigType>) => Partial<{
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
}>
```

</div><hr/></div><div class="api-docs__method" method-data="headerMapper"><h3 class="api-docs__name">

### `headerMapper()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to get default headers and to map them based on the data format exchange, by default it handles FormData / JSON formats.

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:78](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L78)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(command: T) => HeadersInit
```

</div><hr/></div><div class="api-docs__method" method-data="payloadMapper"><h3 class="api-docs__name">

### `payloadMapper()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to get request data and transform them to the required format. It handles FormData and JSON by default.

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:82](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L82)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(data: unknown) => string | FormData
```

</div><hr/></div><div class="api-docs__method" method-data="requestConfig"><h3 class="api-docs__name">

### `requestConfig()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:62](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L62)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(command: CommandInstance) => RequestConfigType
```

</div><hr/></div><div class="api-docs__method" method-data="stringifyQueryParams"><h3 class="api-docs__name">

### `stringifyQueryParams()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to stringify query params from objects.

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:73](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L73)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(queryParams: ClientQueryParamsType | string | NegativeTypes) => string
```

</div><hr/></div><div class="api-docs__method" method-data="addEffect"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:224](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L224)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="effect"><td class="api-docs__param-name required">

#### effect 

`Required`

</td><td class="api-docs__param-type">

`FetchEffectInstance | FetchEffectInstance[]`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
this
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

Clears the builder instance and remove all listeners on it&#x27;s dependencies

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:264](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L264)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="createCommand"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:243](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L243)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(params: CommandConfig<EndpointType, RequestConfigType>) => Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, RequestConfigType, false, false, false, undefined>
```

</div><hr/></div><div class="api-docs__method" method-data="onAuth"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:178](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L178)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`RequestInterceptorCallback`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="onError"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:186](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L186)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`ResponseInterceptorCallback<any, GlobalErrorType | ErrorType>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="onRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:206](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L206)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`RequestInterceptorCallback`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="onResponse"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:214](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L214)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`ResponseInterceptorCallback<any, GlobalErrorType | ErrorType>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="onSuccess"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:196](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L196)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`ResponseInterceptorCallback<any, GlobalErrorType | ErrorType>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="removeEffect"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:233](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L233)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="effect"><td class="api-docs__param-name required">

#### effect 

`Required`

</td><td class="api-docs__param-type">

`string | FetchEffectInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
this
```

</div><hr/></div><div class="api-docs__method" method-data="setClient"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:170](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L170)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`(builder: BuilderInstance) => ClientType`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setCommandConfig"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:103](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L103)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`(command: CommandInstance) => Partial<CommandConfig<string, RequestConfigType>>`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setDebug"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:113](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L113)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="debug"><td class="api-docs__param-name required">

#### debug 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setHeaderMapper"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:154](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L154)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="headerMapper"><td class="api-docs__param-name required">

#### headerMapper 

`Required`

</td><td class="api-docs__param-type">

`ClientHeaderMappingCallback`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setLogger"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:129](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L129)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="callback"><td class="api-docs__param-name required">

#### callback 

`Required`

</td><td class="api-docs__param-type">

`(builder: BuilderInstance) => LoggerManager`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setLoggerSeverity"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:121](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L121)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="severity"><td class="api-docs__param-name required">

#### severity 

`Required`

</td><td class="api-docs__param-type">

`SeverityType`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setPayloadMapper"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:162](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L162)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="payloadMapper"><td class="api-docs__param-name required">

#### payloadMapper 

`Required`

</td><td class="api-docs__param-type">

`ClientPayloadMappingCallback`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setQueryParamsConfig"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:137](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L137)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="queryParamsConfig"><td class="api-docs__param-name required">

#### queryParamsConfig 

`Required`

</td><td class="api-docs__param-type">

`QueryStringifyOptions`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="setStringifyQueryParams"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:146](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L146)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="stringifyFn"><td class="api-docs__param-name required">

#### stringifyFn 

`Required`

</td><td class="api-docs__param-type">

Custom callback handling query params stringify

`StringifyCallbackType`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Builder<GlobalErrorType, RequestConfigType>
```

</div><hr/></div><div class="api-docs__method" method-data="__modifyAuth"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:286](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L286)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<Command<any, any, any, any, any, any, any, any, any, any, any>>
```

</div><hr/></div><div class="api-docs__method" method-data="__modifyErrorResponse"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:296](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L296)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="response"><td class="api-docs__param-name required">

#### response 

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<any, GlobalErrorType>`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<[GenericDataType | null, GenericErrorType | null, number | null]>
```

</div><hr/></div><div class="api-docs__method" method-data="__modifyRequest"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:291](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L291)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<Command<any, any, any, any, any, any, any, any, any, any, any>>
```

</div><hr/></div><div class="api-docs__method" method-data="__modifyResponse"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:308](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L308)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="response"><td class="api-docs__param-name required">

#### response 

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<any, GlobalErrorType>`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<[GenericDataType | null, GenericErrorType | null, number | null]>
```

</div><hr/></div><div class="api-docs__method" method-data="__modifySuccessResponse"><h3 class="api-docs__name">

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

</span></div><p class="api-docs__definition">

Defined in [builder/builder.ts:302](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/builder/builder.ts#L302)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="response"><td class="api-docs__param-name required">

#### response 

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<any, GlobalErrorType>`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`CommandInstance`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Promise<[GenericDataType | null, GenericErrorType | null, number | null]>
```

</div><hr/></div></div>