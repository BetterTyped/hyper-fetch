
      
# FetchQueryParamsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchQueryParamsType = HasQuery extends true ? { queryParams?: NegativeTypes } : { queryParams?: QueryParamsType | string };
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

It will check if the query params are already set

</span></div><div class="api-docs__definition">

Defined in [command/command.types.ts:203](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/command/command.types.ts#L203)

</div>