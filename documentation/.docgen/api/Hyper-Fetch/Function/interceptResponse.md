
      
# interceptResponse

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview fn" data-reactroot="">

```ts
interceptResponse<GlobalErrorType>(interceptors, response, command)
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [builder/builder.utils.ts](https://github.com/BetterTyped/hyper-fetch/blob/982ac882/packages/core/src/builder/builder.utils.ts#L36)

</div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>

**interceptors**

</td><td>

`ResponseInterceptorCallback<any, any>[]`

</td><td>



</td></tr><tr><td>

**response**

</td><td>

`ClientResponseType<any, GlobalErrorType>`

</td><td>



</td></tr><tr><td>

**command**

</td><td>

`CommandInstance`

</td><td>



</td></tr></tbody></table></div><div class="api-docs__section" data-reactroot="">

## Returns

</div><div class="api-docs__returns" data-reactroot="">

```ts
Promise<ClientResponseType<any, GlobalErrorType>>
```

</div>