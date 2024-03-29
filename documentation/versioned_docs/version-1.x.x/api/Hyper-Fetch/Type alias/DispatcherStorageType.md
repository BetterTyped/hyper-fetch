

# DispatcherStorageType

<div class="api-docs__separator">

---

</div><div class="api-docs__import">

```ts
import { DispatcherStorageType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [dispatcher/dispatcher.types.ts:26](https://github.com/BetterTyped/hyper-fetch/blob/3fe127e9/packages/core/src/dispatcher/dispatcher.types.ts#L26)

</p><div class="api-docs__section">

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

## Structure

</div><div class="api-docs__returns">

```ts
{
  clear: () => void;
  delete: (key: string) => void;
  get: (key: string) => DispatcherData<Command> | undefined;
  keys: () => string[] | IterableIterator<string>;
  set: (key: string, data: DispatcherData<Command>) => void;
}
```

</div>