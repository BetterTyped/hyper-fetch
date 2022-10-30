
      
# FetchSendActionsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type FetchSendActionsType = {
  onDownloadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void; 
  onRemove: (details: CommandEventDetails<Command>) => void; 
  onRequestStart: (details: CommandEventDetails<Command>) => void; 
  onResponse: (response: ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>, details: CommandResponseDetails) => void; 
  onResponseStart: (details: CommandEventDetails<Command>) => void; 
  onSettle: (requestId: string, command: Command) => void; 
  onUploadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [command/command.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/command/command.types.ts#L247)

</div>