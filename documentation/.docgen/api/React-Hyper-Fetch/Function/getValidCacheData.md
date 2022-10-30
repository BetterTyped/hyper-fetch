
      
# getValidCacheData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview fn" data-reactroot="">

```ts
getValidCacheData<T>(command, initialData, cacheData)
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [helpers/use-tracked-state/use-tracked-state.utils.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/react/src/helpers/use-tracked-state/use-tracked-state.utils.ts#L33)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**command**

</td><td>

`T`

</td><td>



</td></tr><tr><td>

**initialData**

</td><td>

`ExtractClientReturnType<T>`

</td><td>



</td></tr><tr><td>

**cacheData**

</td><td>

`CacheValueType<ExtractResponse<T>, ExtractError<T>>`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section" data-reactroot="">

## Returns

</div><div class="api-docs__returns" data-reactroot="">

```ts
CacheValueType<ExtractResponse<T>, ExtractError<T>>
```

</div>