
      
# FetchType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type single" data-reactroot="">

```ts
type FetchType = FetchQueryParamsType<ExtractQueryParams<Command>, ExtractHasQueryParams<Command>> & FetchParamsType<ExtractEndpoint<Command>, ExtractHasParams<Command>> & FetchRequestDataType<ExtractRequestData<Command>, ExtractHasData<Command>> & Omit<FetchOptionsType<ExtractClientOptions<Command>>, params | data> & FetchSendActionsType<Command> & CommandQueueOptions;
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div>