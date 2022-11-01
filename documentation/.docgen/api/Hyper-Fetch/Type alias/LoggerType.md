

# LoggerType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { LoggerType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.types.ts:7](https://github.com/BetterTyped/hyper-fetch/blob/c746dc1f/packages/core/src/managers/logger/logger.manager.types.ts#L7)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type LoggerType = Record<LoggerLevelType, (message: LoggerMessageType, ...additionalData: LoggerMessageType[]) => void>;
```

</div>