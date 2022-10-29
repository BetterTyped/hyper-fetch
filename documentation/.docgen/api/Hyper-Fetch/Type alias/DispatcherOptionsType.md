
      
# DispatcherOptionsType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type" data-reactroot="">

```ts
type DispatcherOptionsType = {
  onClearStorage: (dispatcherInstance: Dispatcher) => void; 
  onDeleteFromStorage: <Command>(queueKey: string, data: DispatcherData<Command>) => void; 
  onInitialization: (dispatcherInstance: Dispatcher) => void; 
  onUpdateStorage: <Command>(queueKey: string, data: DispatcherData<Command>) => void; 
  storage: DispatcherStorageType; 
}
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div>