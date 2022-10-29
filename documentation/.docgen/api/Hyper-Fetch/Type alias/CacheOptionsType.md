
      
# CacheOptionsType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type CacheOptionsType = {
  clearKey: string; 
  lazyStorage: CacheAsyncStorageType; 
  onChange: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => void; 
  onDelete: (key: string) => void; 
  onInitialization: (cache: Cache) => void; 
  storage: CacheStorageType; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div>