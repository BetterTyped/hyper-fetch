

# FetchEffect

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchEffect } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:6](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L6)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="config"><td class="api-docs__param-name required">

### config 

`Required`

</td><td class="api-docs__param-type">

`FetchEffectConfig<T>`

</td></tr></tbody></table></div><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="config"><h3 class="api-docs__name">

### `config`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L7)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
FetchEffectConfig<T>
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="getEffectKey"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:9](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L9)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
string
```

</div><hr/></div><div class="api-docs__method" method-data="onError"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:22](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L22)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="response"><td class="api-docs__param-name required">

#### response 

`Required`

</td><td class="api-docs__param-type">

`ClientResponseErrorType<ExtractError<T>>`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`T`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="onFinished"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:25](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L25)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="response"><td class="api-docs__param-name required">

#### response 

`Required`

</td><td class="api-docs__param-type">

`ClientResponseType<ResponseType, ExtractError<T>>`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`T`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="onStart"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:16](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L16)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`T`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="onSuccess"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:19](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L19)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="response"><td class="api-docs__param-name required">

#### response 

`Required`

</td><td class="api-docs__param-type">

`ClientResponseSuccessType<ResponseType>`

</td></tr><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`T`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="onTrigger"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [effect/fetch.effect.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/effect/fetch.effect.ts#L13)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="command"><td class="api-docs__param-name required">

#### command 

`Required`

</td><td class="api-docs__param-type">

`T`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>