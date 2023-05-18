

# LoggerType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { LoggerType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.types.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/managers/logger/logger.manager.types.ts#L7)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type LoggerType = Record<LoggerLevelType, (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
Record<LoggerLevelType, (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void>
```

</div>