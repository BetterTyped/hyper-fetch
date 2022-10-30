
      
# CommandCurrentType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type single" data-reactroot="">

```ts
type CommandCurrentType = { data?: CommandData<RequestDataType, MappedData>; headers?: HeadersInit; mockCallback?: (data: RequestDataType) => ClientResponseType<ResponseType, ErrorType>; params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes; queryParams?: QueryParamsType | NegativeTypes; updatedAbortKey?: boolean; updatedCacheKey?: boolean; updatedEffectKey?: boolean; updatedQueueKey?: boolean; used?: boolean } & Partial<NullableKeys<CommandConfig<GenericEndpoint, ClientOptions>>>;
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [command/command.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/command/command.types.ts#L163)

</div>