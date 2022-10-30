
      
# AppManager

<div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

App manager handles main application states - focus and online. Those two values can answer questions:
- Is the tab or current view instance focused and visible for user?
- Is our application online or offline?
With the app manager it is not a problem to get the valid answer for this question.

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L15)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>builder</th><th><code><span class="api-type__type ">BuilderInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>options</th><th><code><span class="api-type__type ">AppManagerOptionsType</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><div class="api-docs__property"><h3 class="api-docs__name">

### `options`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L22)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
AppManagerOptionsType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `isOnline`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L19)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `isFocused`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L20)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
boolean
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `events`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L17)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
{ emitBlur: () => void; emitFocus: () => void; emitOffline: () => void; emitOnline: () => void; onBlur: (callback: () => void) => VoidFunction; onFocus: (callback: () => void) => VoidFunction; onOffline: (callback: () => void) => VoidFunction; onOnline: (callback: () => void) => VoidFunction }
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L16)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EventEmitter
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `builder`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L22)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
BuilderInstance
```

</div><hr/></div></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L55)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>isFocused</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

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



</span></div><div class="api-docs__definition">

Defined in [managers/app/app.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/managers/app/app.manager.ts#L65)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>isOnline</th><th><code><span class="api-type__type">boolean</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>