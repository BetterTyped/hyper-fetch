
      
# getDispatcherEvents

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview fn" data-reactroot="">

```ts
getDispatcherEvents(emitter)
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [dispatcher/dispatcher.events.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/dispatcher/dispatcher.events.ts#L11)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>emitter</th><th><code><span class="api-type__type ">EventEmitter</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Returns

</div><div class="api-docs__returns" data-reactroot="">

```ts
{ onDrained: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueChange: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; onQueueStatus: <Command>(queueKey: string, callback: (values: DispatcherData<Command>) => void) => VoidFunction; setDrained: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueChanged: <Command>(queueKey: string, values: DispatcherData<Command>) => void; setQueueStatus: <Command>(queueKey: string, values: DispatcherData<Command>) => void }
```

</div>