
      
# CacheAsyncStorageType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type CacheAsyncStorageType = {
  delete: (key: string) => Promise<void>; 
  get: <Response, Error>(key: string) => Promise<CacheValueType<Response, Error> | undefined>; 
  keys: () => Promise<string[] | IterableIterator<string> | string[]>; 
  set: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => Promise<void>; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div>