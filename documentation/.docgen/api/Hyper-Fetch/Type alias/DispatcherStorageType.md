
      
# DispatcherStorageType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type">

```ts
type DispatcherStorageType = {
  clear: () => void; 
  delete: (key: string) => void; 
  get: <Command>(key: string) => DispatcherData<Command> | undefined; 
  keys: () => string[] | IterableIterator<string>; 
  set: <Command>(key: string, data: DispatcherData<Command>) => void; 
}
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.types.ts:26](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/dispatcher/dispatcher.types.ts#L26)

</div>