
      
# commandSendRequest

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview fn">

```ts
commandSendRequest<Command>(command, options)
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition">

Defined in [command/command.utils.ts:113](https://github.com/BetterTyped/hyper-fetch/blob/1a97772c/packages/core/src/command/command.utils.ts#L113)

</div><div class="api-docs__section">

## Parameters

</div><div class="api-docs__parameters"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr param-data="command"><td>

**command**

</td><td>

`Command`

</td><td>



</td></tr><tr param-data="options"><td>

**options**

</td><td>

`FetchType<Command>`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section">

## Returns

</div><div class="api-docs__returns">

```ts
Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>>
```

</div>