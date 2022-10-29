
      
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

</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>builder</th><th><code><span class="api-type__type ">Builder</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandOptions</th><th><code><span class="api-type__type ">CommandConfig</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandDump</th><th><code><span class="api-type__type ">CommandCurrentType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol">, </span><span class="api-type__type ">QueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">LocalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">, </span><span class="api-type__type ">MappedData</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>dataMapper</th><th><code>todo</code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>used</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>send</th><th><code><span class="api-type__type ">FetchMethodType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">Command</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol">, </span><span class="api-type__type ">QueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">LocalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">, </span><span class="api-type__type ">HasData</span><span class="api-type__symbol">, </span><span class="api-type__type ">HasParams</span><span class="api-type__symbol">, </span><span class="api-type__type ">HasQuery</span><span class="api-type__symbol">, </span><span class="api-type__type ">MappedData</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method used to perform requests with usage of cache and queues

</span></div></th></tr><tr><th>retryTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>retry</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>queued</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>queryParams</th><th><code><span class="api-type__type ">QueryParamsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>params</th><th><code><span class="api-type__type ">ExtractRouteParams</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">ClientOptions</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>offline</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>method</th><th><code><span class="api-type__type ">HttpMethodsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>headers</th><th><code><span class="api-type__type ">HeadersInit</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>exec</th><th><code><span class="api-type__type ">FetchMethodType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">Command</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol">, </span><span class="api-type__type ">QueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">LocalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">, </span><span class="api-type__type ">HasData</span><span class="api-type__symbol">, </span><span class="api-type__type ">HasParams</span><span class="api-type__symbol">, </span><span class="api-type__type ">HasQuery</span><span class="api-type__symbol">, </span><span class="api-type__type ">MappedData</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">

Method to use the command WITHOUT adding it to cache and queues. This mean it will make simple request without queue side effects.

</span></div></th></tr><tr><th>endpoint</th><th><code><span class="api-type__type ">EndpointType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>effectKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>deduplicateTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>deduplicate</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>dataMapper</th><th><code>todo</code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>data</th><th><code><span class="api-type__type ">MappedData</span><span class="api-type__symbol"> extends </span><span class="api-type__type">undefined</span><span class="api-type__symbol"> ? </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol"> : </span><span class="api-type__type ">MappedData</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandOptions</th><th><code><span class="api-type__type ">CommandConfig</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>commandDump</th><th><code><span class="api-type__type ">CommandCurrentType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol">, </span><span class="api-type__type ">QueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">LocalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">, </span><span class="api-type__type ">MappedData</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>cancelable</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>cacheTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>cache</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>builder</th><th><code><span class="api-type__type ">Builder</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>auth</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `abort()`

</h3><div class="api-docs__call-preview">

```tsx
abort()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `clone()`

</h3><div class="api-docs__call-preview">

```tsx
clone<D, P, Q, MapperData>(options, mapper)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>options</th><th><code><span class="api-type__type ">CommandCurrentType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">RequestDataType</span><span class="api-type__symbol">, </span><span class="api-type__type ">QueryParamsType</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol"> | </span><span class="api-type__type ">LocalErrorType</span><span class="api-type__symbol">, </span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ClientOptions</span><span class="api-type__symbol">, </span><span class="api-type__type ">MapperData</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>mapper</th><th><code>todo</code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, D, P, Q, MapperData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `dump()`

</h3><div class="api-docs__call-preview">

```tsx
dump()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `CommandDump<Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>, ClientOptions, QueryParamsType, ExtractRouteParams<EndpointType>>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setAbortKey()`

</h3><div class="api-docs__call-preview">

```tsx
setAbortKey(abortKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setAuth()`

</h3><div class="api-docs__call-preview">

```tsx
setAuth(auth)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>auth</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setCache()`

</h3><div class="api-docs__call-preview">

```tsx
setCache(cache)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cache</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setCacheKey()`

</h3><div class="api-docs__call-preview">

```tsx
setCacheKey(cacheKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setCacheTime()`

</h3><div class="api-docs__call-preview">

```tsx
setCacheTime(cacheTime)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cacheTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setCancelable()`

</h3><div class="api-docs__call-preview">

```tsx
setCancelable(cancelable)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>cancelable</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setData()`

</h3><div class="api-docs__call-preview">

```tsx
setData(data)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>data</th><th><code><span class="api-type__type ">RequestDataType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, true, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setDataMapper()`

</h3><div class="api-docs__call-preview">

```tsx
setDataMapper<DataMapper>(mapper)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>mapper</th><th><code>todo</code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, DataMapper>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setDeduplicate()`

</h3><div class="api-docs__call-preview">

```tsx
setDeduplicate(deduplicate)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>deduplicate</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setDeduplicateTime()`

</h3><div class="api-docs__call-preview">

```tsx
setDeduplicateTime(deduplicateTime)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>deduplicateTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setEffectKey()`

</h3><div class="api-docs__call-preview">

```tsx
setEffectKey(effectKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>effectKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setHeaders()`

</h3><div class="api-docs__call-preview">

```tsx
setHeaders(headers)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>headers</th><th><code><span class="api-type__type ">HeadersInit</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setOffline()`

</h3><div class="api-docs__call-preview">

```tsx
setOffline(offline)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>offline</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setOptions()`

</h3><div class="api-docs__call-preview">

```tsx
setOptions(options)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>options</th><th><code><span class="api-type__type ">ClientOptions</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, true, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setParams()`

</h3><div class="api-docs__call-preview">

```tsx
setParams(params)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>params</th><th><code><span class="api-type__type ">ExtractRouteParams</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">EndpointType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, true, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setQueryParams()`

</h3><div class="api-docs__call-preview">

```tsx
setQueryParams(queryParams)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queryParams</th><th><code><span class="api-type__type ">QueryParamsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, true, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setQueueKey()`

</h3><div class="api-docs__call-preview">

```tsx
setQueueKey(queueKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queueKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setQueued()`

</h3><div class="api-docs__call-preview">

```tsx
setQueued(queued)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>queued</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setRetry()`

</h3><div class="api-docs__call-preview">

```tsx
setRetry(retry)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>retry</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setRetryTime()`

</h3><div class="api-docs__call-preview">

```tsx
setRetryTime(retryTime)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>retryTime</th><th><code><span class="api-type__type">number</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setUsed()`

</h3><div class="api-docs__call-preview">

```tsx
setUsed(used)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>used</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `Command<ResponseType, RequestDataType, QueryParamsType, GlobalErrorType, LocalErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery, MappedData>`

</div><hr/></div></div>