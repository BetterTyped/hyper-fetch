
      
# FetchEffect

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>config</th><th><code><span class="api-type__type ">FetchEffectConfig</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">T</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>config</th><th><code><span class="api-type__type">void</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `getEffectKey()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
getEffectKey()
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
string
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onError()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onError(response, command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseErrorType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ExtractError</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">T</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">T</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onFinished()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onFinished(response, command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">, </span><span class="api-type__type ">ExtractError</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">T</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">T</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onStart()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onStart(command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">T</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onSuccess()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onSuccess(response, command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseSuccessType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ResponseType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">T</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `onTrigger()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
onTrigger(command)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">T</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>