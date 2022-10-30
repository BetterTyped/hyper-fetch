

# getRequestEta

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getRequestEta(startDate, progressDate, __namedParameters)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.utils.ts:24](https://github.com/BetterTyped/hyper-fetch/blob/d6c03b85/packages/core/src/command/command.utils.ts#L24)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Default</th></tr></thead><tbody><tr param-data="startDate"><td class="api-docs__param-name required">

**startDate** `Required`

</td><td class="api-docs__param-type">

`Date`

</td><td class="api-docs__param-default">



</td></tr><tr param-data="progressDate"><td class="api-docs__param-name required">

**progressDate** `Required`

</td><td class="api-docs__param-type">

`Date`

</td><td class="api-docs__param-default">



</td></tr><tr param-data="__namedParameters"><td class="api-docs__param-name required">

**\_\_namedParameters** `Required`

</td><td class="api-docs__param-type">

`ClientProgressEvent`

</td><td class="api-docs__param-default">



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
{ sizeLeft: number; timeLeft: number }
```

</div>