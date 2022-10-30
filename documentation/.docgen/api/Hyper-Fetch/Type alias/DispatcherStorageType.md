
      
# DispatcherStorageType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type DispatcherStorageType = {
  clear: () => void; 
  delete: (key: string) => void; 
  get: <Command>(key: string) => DispatcherData<Command> | undefined; 
  keys: () => string[] | IterableIterator<string>; 
  set: <Command>(key: string, data: DispatcherData<Command>) => void; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [dispatcher/dispatcher.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/dispatcher/dispatcher.types.ts#L26)

</div>