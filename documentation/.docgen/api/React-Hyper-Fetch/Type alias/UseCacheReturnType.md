
      
# UseCacheReturnType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type single" data-reactroot="">

```ts
type UseCacheReturnType = UseTrackedStateType<T> & UseTrackedStateActions<T> & { onCacheChange: (callback: OnFinishedCallbackType<T>) => void; onCacheError: (callback: OnErrorCallbackType<T>) => void; onCacheSuccess: (callback: OnSuccessCallbackType<T>) => void; revalidate: (invalidateKey?: string | RegExp | CommandInstance) => void };
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [hooks/use-cache/use-cache.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/react/src/hooks/use-cache/use-cache.types.ts#L27)

</div>