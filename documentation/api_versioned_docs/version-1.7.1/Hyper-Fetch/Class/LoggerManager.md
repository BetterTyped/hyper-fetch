

# LoggerManager

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { LoggerManager } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

This class is used across the Hyper Fetch library to provide unified logging system with necessary setup per each builder.
We can set up the logging level based on available values. This manager enable to initialize the logging instance per individual module
like Builder, Command etc. Which can give you better feedback on the logging itself.

</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts:11](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/managers/logger/logger.manager.ts#L11)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="builder"><td class="api-docs__param-name required">

### builder 

`Required`

</td><td class="api-docs__param-type">

`Pick<BuilderInstance, debug>`

</td></tr><tr param-data="options"><td class="api-docs__param-name optional">

### options 

`Optional`

</td><td class="api-docs__param-type">

`LoggerOptionsType`

</td></tr></tbody></table></div><div class="api-docs__section">

## Properties

</div><div class="api-docs__properties"><div class="api-docs__property" property-data="emitter"><h3 class="api-docs__name">

### `emitter`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts:15](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/managers/logger/logger.manager.ts#L15)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
EventEmitter
```

</div><hr/></div><div class="api-docs__property" property-data="severity"><h3 class="api-docs__name">

### `severity`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts:13](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/managers/logger/logger.manager.ts#L13)

</p><div class="api-docs__section">

#### Type

</div><div class="api-docs__property-type">

```ts
SeverityType
```

</div><hr/></div></div><div class="api-docs__section">

## Methods

</div><div class="api-docs__methods"><div class="api-docs__method" method-data="logger"><h3 class="api-docs__name">

### `logger()`

</h3><div class="api-docs__section">

#### Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts:12](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/managers/logger/logger.manager.ts#L12)

</p><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
(log: LogType) => void
```

</div><hr/></div><div class="api-docs__method" method-data="init"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts:26](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/managers/logger/logger.manager.ts#L26)

</p><div class="api-docs__section">

#### Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr param-data="module"><td class="api-docs__param-name required">

#### module 

`Required`

</td><td class="api-docs__param-type">

`string`

</td></tr></tbody></table></div><div class="api-docs__section">

#### Return

</div><div class="api-docs__returns">

```ts
Record<LoggerLevelType, (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void>
```

</div><hr/></div><div class="api-docs__method" method-data="setSeverity"><h3 class="api-docs__name">

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



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.ts:22](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/managers/logger/logger.manager.ts#L22)

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
void
```

</div><hr/></div></div>