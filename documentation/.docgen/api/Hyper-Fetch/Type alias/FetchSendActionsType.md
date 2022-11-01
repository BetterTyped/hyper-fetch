

# FetchSendActionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchSendActionsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:247](https://github.com/BetterTyped/hyper-fetch/blob/4197368e/packages/core/src/command/command.types.ts#L247)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type FetchSendActionsType<Command> = {
  onDownloadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void; 
  onRemove: (details: CommandEventDetails<Command>) => void; 
  onRequestStart: (details: CommandEventDetails<Command>) => void; 
  onResponse: (response: ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>, details: CommandResponseDetails) => void; 
  onResponseStart: (details: CommandEventDetails<Command>) => void; 
  onSettle: (requestId: string, command: Command) => void; 
  onUploadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void; 
}
```

</div>