
      
# FetchParamsType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type single" data-reactroot="">

```ts
type FetchParamsType = ExtractRouteParams<EndpointType> extends NegativeTypes ? { params?: NegativeTypes } : true extends HasParams ? { params?: NegativeTypes } : { params: ExtractRouteParams<EndpointType> };
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

If the command endpoint parameters are not filled it will throw an error

</span></div><div class="api-docs__definition" data-reactroot="">

Defined in [command/command.types.ts](https://github.com/BetterTyped/hyper-fetch/blob/089b54eb/packages/core/src/command/command.types.ts#L212)

</div>