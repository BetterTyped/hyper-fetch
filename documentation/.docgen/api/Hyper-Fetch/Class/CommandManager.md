
      
# CommandManager

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

**Command Manager** is used to emit 
`command lifecycle events`
 like - request start, request end, upload and download progress.
It is also the place of 
`request aborting`
 system, here we store all the keys and controllers that are isolated for each builder instance.

</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>events</th><th><code><span class="api-type__symbol">&#123; </span><span>emitAbort<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitDownloadProgress<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitLoading<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitRemove<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitRequestStart<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitResponse<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitResponseStart<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>emitUploadProgress<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onAbort<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onAbortById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onDownloadProgress<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onDownloadProgressById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onLoading<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onLoadingById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onRemove<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onRemoveById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onRequestStart<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onRequestStartById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onResponse<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onResponseById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onResponseStart<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onResponseStartById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onUploadProgress<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol">; </span><span>onUploadProgressById<span class="api-type__symbol">: </span>todo</span><span class="api-type__symbol"> &#125;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>emitter</th><th><code><span class="api-type__type ">EventEmitter</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>abortControllers</th><th><code><span class="api-type__type ">Map</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">string</span><span class="api-type__symbol">, </span><span class="api-type__type ">Map</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">string</span><span class="api-type__symbol">, </span><span class="api-type__type ">AbortController</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `abortAll()`

</h3><div class="api-docs__call-preview">

```tsx
abortAll()
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `abortByKey()`

</h3><div class="api-docs__call-preview">

```tsx
abortByKey(abortKey)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `abortByRequestId()`

</h3><div class="api-docs__call-preview">

```tsx
abortByRequestId(abortKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `addAbortController()`

</h3><div class="api-docs__call-preview">

```tsx
addAbortController(abortKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getAbortController()`

</h3><div class="api-docs__call-preview">

```tsx
getAbortController(abortKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `AbortController`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `removeAbortController()`

</h3><div class="api-docs__call-preview">

```tsx
removeAbortController(abortKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `useAbortController()`

</h3><div class="api-docs__call-preview">

```tsx
useAbortController(abortKey, requestId)
```

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__returns">

Returns `void`

</div><hr/></div></div>