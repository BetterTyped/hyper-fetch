
      
# FetchMethodType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type single" data-reactroot="">

```ts
type FetchMethodType = FetchType<Command>[data] extends any ? (options?: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>> : FetchType<Command>[data] extends NegativeTypes ? FetchType<Command>[params] extends NegativeTypes ? (options?: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>> : (options: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>> : (options: FetchType<Command>) => Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>>;
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [command/command.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.types.ts#L260)

</div>