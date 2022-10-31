

# getCommandManagerEvents

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { getCommandManagerEvents } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/command/command.manager.events.ts:27](https://github.com/BetterTyped/hyper-fetch/blob/479dcad6/packages/core/src/managers/command/command.manager.events.ts#L27)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getCommandManagerEvents(emitter)
```

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody><tr param-data="emitter"><td class="api-docs__param-name required">

### emitter 

`Required`

</td><td class="api-docs__param-type">

`EventEmitter`

</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{
    "emitAbort": "void",
    "emitDownloadProgress": "void",
    "emitLoading": "void",
    "emitRemove": "void",
    "emitRequestStart": "void",
    "emitResponse": "void",
    "emitResponseStart": "void",
    "emitUploadProgress": "void",
    "onAbort": "void",
    "onAbortById": "void",
    "onDownloadProgress": "void",
    "onDownloadProgressById": "void",
    "onLoading": "void",
    "onLoadingById": "void",
    "onRemove": "void",
    "onRemoveById": "void",
    "onRequestStart": "void",
    "onRequestStartById": "void",
    "onResponse": "void",
    "onResponseById": "void",
    "onResponseStart": "void",
    "onResponseStartById": "void",
    "onUploadProgress": "void",
    "onUploadProgressById": "void"
}
```

</div>