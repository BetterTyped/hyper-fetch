

# AppManager

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { AppManager } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

App manager handles main application states - focus and online. Those two values can answer questions:
- Is the tab or current view instance focused and visible for user?
- Is our application online or offline?
With the app manager it is not a problem to get the valid answer for this question.

</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:15](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L15)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="builder"><td class="api-docs__param-name required">

### builder 

`Required`

</td><td class="api-docs__param-type">

`BuilderInstance`

</td></tr><tr param-data="options"><td class="api-docs__param-name optional">

### options 

`Optional`

</td><td class="api-docs__param-type">

`AppManagerOptionsType`

</td></tr></tbody></table></div><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="builder"><h3 class="api-docs__name">

### `builder`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:22](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L22)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
BuilderInstance
```

</div><hr/></div><div class="api-docs__property" property-data="emitter"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:16](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L16)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EventEmitter
```

</div><hr/></div><div class="api-docs__property" property-data="events"><h3 class="api-docs__name">

### `events`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:17](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L17)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
{ emitBlur: () => void; emitFocus: () => void; emitOffline: () => void; emitOnline: () => void; onBlur: (callback: () => void) => VoidFunction; onFocus: (callback: () => void) => VoidFunction; onOffline: (callback: () => void) => VoidFunction; onOnline: (callback: () => void) => VoidFunction }
```

</div><hr/></div><div class="api-docs__property" property-data="isFocused"><h3 class="api-docs__name">

### `isFocused`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:20](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L20)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="isOnline"><h3 class="api-docs__name">

### `isOnline`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:19](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L19)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property" property-data="options"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:22](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L22)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
AppManagerOptionsType
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="setFocused"><h3 class="api-docs__name">

### `setFocused()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setFocused(isFocused)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:55](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L55)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="isFocused"><td class="api-docs__param-name required">

#### isFocused 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method" method-data="setOnline"><h3 class="api-docs__name">

### `setOnline()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setOnline(isOnline)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.ts:65](https://github.com/BetterTyped/hyper-fetch/blob/9cf1f580/packages/core/src/managers/app/app.manager.ts#L65)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="isOnline"><td class="api-docs__param-name required">

#### isOnline 

`Required`

</td><td class="api-docs__param-type">

`boolean`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>