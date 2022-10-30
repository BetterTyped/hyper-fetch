
      
# getDispatcherEvents

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getDispatcherEvents(emitter)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [dispatcher/dispatcher.events.ts:11](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/dispatcher/dispatcher.events.ts#L11)

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr param-data="emitter"><td>

**emitter**

</td><td>

`EventEmitter`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{ onDrained: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueChange: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueStatus: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; setDrained: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueChanged: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueStatus: <Command>(queueKey: string, values: DispatcherData<Command>) => void }
```

</div>