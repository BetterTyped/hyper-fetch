
      
# FetchEffect

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L6)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**config**

</td><td>

`FetchEffectConfig<T>`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><div class="api-docs__property"><h3 class="api-docs__name">

### `config`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L7)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
FetchEffectConfig<T>
```

</div><hr/></div></div><div class="api-docs__section" data-reactroot="">

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



</span></div><div class="api-docs__definition">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L9)

</div><div class="api-docs__section">

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



</span></div><div class="api-docs__definition">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L22)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**response**

</td><td>

`ClientResponseErrorType<ExtractError<T>>`

</td><td>



</td></tr><tr><td>

**command**

</td><td>

`T`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

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



</span></div><div class="api-docs__definition">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L25)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**response**

</td><td>

`ClientResponseType<ResponseType, ExtractError<T>>`

</td><td>



</td></tr><tr><td>

**command**

</td><td>

`T`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

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



</span></div><div class="api-docs__definition">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L16)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**command**

</td><td>

`T`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

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



</span></div><div class="api-docs__definition">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L19)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**response**

</td><td>

`ClientResponseSuccessType<ResponseType>`

</td><td>



</td></tr><tr><td>

**command**

</td><td>

`T`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

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



</span></div><div class="api-docs__definition">

Defined in [effect/fetch.effect.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/effect/fetch.effect.ts#L13)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**command**

</td><td>

`T`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>