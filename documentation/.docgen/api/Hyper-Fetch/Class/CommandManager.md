
      
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

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>events</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>emitter</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>abortControllers</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `abortAll()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
abortAll()
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `abortByKey()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
abortByKey(abortKey)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `abortByRequestId()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
abortByRequestId(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `addAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
addAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `getAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
AbortController
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `removeAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
removeAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `useAbortController()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
useAbortController(abortKey, requestId)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>abortKey</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>requestId</th><th><code><span class="api-type__type">string</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>