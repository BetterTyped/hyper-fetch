
      
# interceptResponse

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview fn" data-reactroot="">

```ts
interceptResponse<GlobalErrorType>(interceptors, response, command)
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div><div class="api-docs__section" data-reactroot="">

## Parameters

</div><div class="api-docs__parameters" data-reactroot=""><table>

<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><th>interceptors</th><th><code><span class="api-type__type ">ResponseInterceptorCallback</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type">any</span><span class="api-type__symbol">&ampgt;</span><span class="api-type__symbol">[]</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>response</th><th><code><span class="api-type__type ">ClientResponseType</span><span class="api-type__symbol">&amplt;</span><span class="api-type__type">any</span><span class="api-type__symbol">, </span><span class="api-type__type ">GlobalErrorType</span><span class="api-type__symbol">&ampgt;</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr><tr><th>command</th><th><code><span class="api-type__type ">CommandInstance</span></code></th><th><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div></th></tr></tbody></table>

</table></div><div class="api-docs__section" data-reactroot="">

## Returns

</div><div class="api-docs__returns" data-reactroot="">

```ts
Promise<ClientResponseType<any, GlobalErrorType>>
```

</div>