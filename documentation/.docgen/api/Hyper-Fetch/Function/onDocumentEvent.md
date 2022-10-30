

# onDocumentEvent

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
onDocumentEvent<K>(key, listener, options)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [managers/app/app.manager.utils.ts:26](https://github.com/BetterTyped/hyper-fetch/blob/d6c03b85/packages/core/src/managers/app/app.manager.utils.ts#L26)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Default</th></tr></thead><tbody><tr param-data="key"><td class="api-docs__param-name required">

**key** `Required`

</td><td class="api-docs__param-type">

`K`

</td><td class="api-docs__param-default">



</td></tr><tr param-data="listener"><td class="api-docs__param-name required">

**listener** `Required`

</td><td class="api-docs__param-type">

`(this: Document, ev: DocumentEventMap[K]) => any`

</td><td class="api-docs__param-default">



</td></tr><tr param-data="options"><td class="api-docs__param-name optional">

**options** `Optional`

</td><td class="api-docs__param-type">

`boolean | AddEventListenerOptions`

</td><td class="api-docs__param-default">



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
void
```

</div>