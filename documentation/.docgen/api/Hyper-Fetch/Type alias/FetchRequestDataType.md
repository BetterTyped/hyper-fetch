
      
# FetchRequestDataType

<div class="api-docs__section" data-reactroot="">

## Preview

</div><div class="api-docs__preview type single" data-reactroot="">

```ts
type FetchRequestDataType = RequestDataType extends NegativeTypes ? { data?: NegativeTypes } : HasData extends true ? { data?: NegativeTypes } : { data: RequestDataType };
```

</div><div class="api-docs__section" data-reactroot="">

## Description

</div><div class="api-docs__description" data-reactroot=""><span class="api-docs__do-not-parse">

If the command data is not filled it will throw an error

</span></div>