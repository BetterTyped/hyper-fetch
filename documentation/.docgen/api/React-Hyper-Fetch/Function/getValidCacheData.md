
      
# getValidCacheData

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getValidCacheData<T>(command, initialData, cacheData)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [helpers/use-tracked-state/use-tracked-state.utils.ts:33](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/react/src/helpers/use-tracked-state/use-tracked-state.utils.ts#L33)

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr param-data="command"><td>

**command**

</td><td>

`T`

</td><td>



</td></tr><tr param-data="initialData"><td>

**initialData**

</td><td>

`ExtractClientReturnType<T>`

</td><td>



</td></tr><tr param-data="cacheData"><td>

**cacheData**

</td><td>

`CacheValueType<ExtractResponse<T>, ExtractError<T>>`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
CacheValueType<ExtractResponse<T>, ExtractError<T>>
```

</div>