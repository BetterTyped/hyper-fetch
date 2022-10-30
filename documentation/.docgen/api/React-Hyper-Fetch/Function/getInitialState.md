

# getInitialState

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
getInitialState<T>(initialData, dispatcher, command)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [helpers/use-tracked-state/use-tracked-state.utils.ts:60](https://github.com/BetterTyped/hyper-fetch/blob/d6c03b85/packages/react/src/helpers/use-tracked-state/use-tracked-state.utils.ts#L60)

</p><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Default</th></tr></thead><tbody><tr param-data="initialData"><td class="api-docs__param-name required">

**initialData** `Required`

</td><td class="api-docs__param-type">

`ClientResponseType<ExtractResponse<T>, ExtractError<T>>`

</td><td class="api-docs__param-default">



</td></tr><tr param-data="dispatcher"><td class="api-docs__param-name required">

**dispatcher** `Required`

</td><td class="api-docs__param-type">

`Dispatcher`

</td><td class="api-docs__param-default">



</td></tr><tr param-data="command"><td class="api-docs__param-name required">

**command** `Required`

</td><td class="api-docs__param-type">

`T`

</td><td class="api-docs__param-default">



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
UseTrackedStateType<T>
```

</div>