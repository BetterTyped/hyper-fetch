
      
# getValidCacheData

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview fn" data-reactroot="">

```ts
getValidCacheData<T>(command, initialData, cacheData)
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [helpers/use-tracked-state/use-tracked-state.utils.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/react/src/helpers/use-tracked-state/use-tracked-state.utils.ts#L33)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>command</th><th><code><span class="api-type__type ">T</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>initialData</th><th><code><span class="api-type__type ">ExtractClientReturnType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">T</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>cacheData</th><th><code><span class="api-type__type ">CacheValueType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">ExtractResponse</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">T</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">, </span><span class="api-type__type ">ExtractError</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type ">T</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Returns

</div><div class="api-docs__returns" data-reactroot="">

```ts
CacheValueType<ExtractResponse<T>, ExtractError<T>>
```

</div>