
      
# ExtractRouteParams

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type single" data-reactroot="">

```ts
type ExtractRouteParams = string extends T ? NegativeTypes : T extends `${string}:${infer  Param}/${infer  Rest}` ? { [ k in Param | keyof ExtractRouteParams<Rest> ]: ParamType } : T extends `${string}:${infer  Param}` ? { [ k in Param ]: ParamType } : NegativeTypes;
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">



</span></div>