

# FetchQueryParamsType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { FetchQueryParamsType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">

It will check if the query params are already set

</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:203](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/command/command.types.ts#L203)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type FetchQueryParamsType<QueryParamsType,HasQuery> = HasQuery extends true ? { queryParams?: NegativeTypes } : { queryParams?: QueryParamsType | string };
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
HasQuery extends true ? [object Object] : [object Object]
```

</div>