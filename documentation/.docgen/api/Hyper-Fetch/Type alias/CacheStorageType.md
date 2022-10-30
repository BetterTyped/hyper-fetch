
      
# CacheStorageType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type CacheStorageType = {
  clear: () => void; 
  delete: (key: string) => void; 
  get: <Response, Error>(key: string) => CacheValueType<Response, Error> | undefined; 
  keys: () => string[] | IterableIterator<string> | string[]; 
  set: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => void; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [cache/cache.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/cache/cache.types.ts#L48)

</div>