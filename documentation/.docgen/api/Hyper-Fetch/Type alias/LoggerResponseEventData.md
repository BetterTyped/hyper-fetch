

# LoggerResponseEventData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { LoggerResponseEventData } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/logger/logger.manager.types.ts:30](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/managers/logger/logger.manager.types.ts#L30)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type LoggerResponseEventData = {
  command: CommandInstance; 
  details: CommandResponseDetails; 
  requestId: string; 
  response: ClientResponseType<unknown, unknown>; 
}
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  command: Command<any, any, any, any, any, any, any, any, any, any, any>;
  details: {
      isCanceled: boolean;
      isFailed: boolean;
      isOffline: boolean;
      retries: number;
      timestamp: number;
  };
  requestId: string;
  response: [GenericDataType | null, GenericErrorType | null, number | null];
}
```

</div>