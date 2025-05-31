

# FetchType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { FetchType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:242](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/command/command.types.ts#L242)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchType<Command> = FetchQueryParamsType<ExtractQueryParams<Command>, ExtractHasQueryParams<Command>> & FetchParamsType<ExtractEndpoint<Command>, ExtractHasParams<Command>> & FetchRequestDataType<ExtractRequestData<Command>, ExtractHasData<Command>> & Omit<FetchOptionsType<ExtractClientOptions<Command>>, params | data> & FetchSendActionsType<Command> & CommandQueueOptions;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  ...params1: HasQuery extends true ? {
  queryParams: NegativeTypes;
} : {
  queryParams: QueryParamsType | string;
};
  ...params2: ExtractRouteParams<EndpointType> extends NegativeTypes ? {
  params: NegativeTypes;
} : (true extends HasParams ? {
  params: NegativeTypes;
} : {
  params: ExtractRouteParams<EndpointType>;
});
  ...params3: RequestDataType extends NegativeTypes ? {
  data: NegativeTypes;
} : (HasData extends true ? {
  data: NegativeTypes;
} : {
  data: RequestDataType;
});
  ...params4: Partial<CommandConfig<string, ClientOptions>>;
  onDownloadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void;
  onRemove: (details: CommandEventDetails<Command>) => void;
  onRequestStart: (details: CommandEventDetails<Command>) => void;
  onResponse: (response: ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>, details: CommandResponseDetails) => void;
  onResponseStart: (details: CommandEventDetails<Command>) => void;
  onSettle: (requestId: string, command: Command) => void;
  onUploadProgress: (values: FetchProgressType, details: CommandEventDetails<Command>) => void;
  dispatcherType: auto | fetch | submit;
}
```

</div>