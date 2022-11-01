

# FetchMethodType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchMethodType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:260](https://github.com/BetterTyped/hyper-fetch/blob/2ce105c7/packages/core/src/command/command.types.ts#L260)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchMethodType<Command> = FetchType<Command>[data] extends any ? (options?: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>> : FetchType<Command>[data] extends NegativeTypes ? FetchType<Command>[params] extends NegativeTypes ? (options?: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>> : (options: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>> : (options: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
FetchType<Command>[data] extends any ? (options?: FetchType<Command>) => Promise<[GenericDataType | null, GenericErrorType | null, number | null]> : (FetchType<Command>[data] extends NegativeTypes ? (FetchType<Command>[params] extends NegativeTypes ? (options?: FetchType<Command>) => Promise<[GenericDataType | null, GenericErrorType | null, number | null]> : (options: FetchType<Command>) => Promise<[GenericDataType | null, GenericErrorType | null, number | null]>) : (options: FetchType<Command>) => Promise<[GenericDataType | null, GenericErrorType | null, number | null]>)
```

</div>