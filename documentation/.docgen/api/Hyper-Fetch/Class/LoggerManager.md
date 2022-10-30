
      
# LoggerManager

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each builder.
We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
like Builder, Command etc. Which can give you better feedback on the logging itself.

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [managers/logger/logger.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/logger/logger.manager.ts#L11)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**builder**

</td><td>

`BuilderInstance`

</td><td>



</td></tr><tr><td>

**options**

</td><td>

`LoggerOptionsType`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section" data-reactroot="">

## Properties

</div><div class="api-docs__properties" data-reactroot=""><div class="api-docs__property"><h3 class="api-docs__name">

### `severity`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/logger/logger.manager.ts#L13)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
SeverityType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `logger`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/logger/logger.manager.ts#L12)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
LoggerFunctionType
```

</div><hr/></div><div class="api-docs__property"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/logger/logger.manager.ts#L15)

</div><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EventEmitter
```

</div><hr/></div></div><div class="api-docs__section" data-reactroot="">

## Methods

</div><div class="api-docs__methods" data-reactroot=""><div class="api-docs__method"><h3 class="api-docs__name">

### `init()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
init(module)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/logger/logger.manager.ts#L26)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**module**

</td><td>

`string`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
LoggerType
```

</div><hr/></div><div class="api-docs__method"><h3 class="api-docs__name">

### `setSeverity()`

</h3><div class="api-docs__section">

#### Preview

</div><div class="api-docs__preview fn">

```ts
setSeverity(severity)
```

</div><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/managers/logger/logger.manager.ts#L22)

</div><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**severity**

</td><td>

`SeverityType`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
void
```

</div><hr/></div></div>