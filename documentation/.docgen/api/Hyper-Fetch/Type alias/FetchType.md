

# FetchType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:237](https://github.com/BetterTyped/hyper-fetch/blob/7e232edb/packages/core/src/command/command.types.ts#L237)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchType<Command> = FetchQueryParamsType<ExtractQueryParams<Command>, ExtractHasQueryParams<Command>> & FetchParamsType<ExtractEndpoint<Command>, ExtractHasParams<Command>> & FetchRequestDataType<ExtractRequestData<Command>, ExtractHasData<Command>> & Omit<FetchOptionsType<ExtractClientOptions<Command>>, params | data> & FetchSendActionsType<Command> & CommandQueueOptions;
```

</div>