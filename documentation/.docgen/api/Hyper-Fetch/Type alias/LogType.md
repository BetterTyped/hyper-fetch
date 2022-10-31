

# LogType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { LogType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.types.ts:15](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/core/src/managers/logger/logger.manager.types.ts#L15)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type LogType = {
  additionalData: LoggerMessageType[]; 
  enabled: boolean; 
  level: LoggerLevelType; 
  message: LoggerMessageType; 
  module: string; 
  severity: SeverityType; 
}
```

</div>