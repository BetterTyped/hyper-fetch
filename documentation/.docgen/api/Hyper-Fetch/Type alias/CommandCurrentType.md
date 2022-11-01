

# CommandCurrentType

<div class="api-docs__separator" data-reactroot="">

---

</div><div class="api-docs__import" data-reactroot="">

```ts
import { CommandCurrentType } from "@hyper-fetch/core"
```

</div><div class="api-docs__section">

## Description

</div><div class="api-docs__description"><span class="api-docs__do-not-parse">



</span></div><p class="api-docs__definition">

Defined in [command/command.types.ts:163](https://github.com/BetterTyped/hyper-fetch/blob/6c3eaa91/packages/core/src/command/command.types.ts#L163)

</p><div class="api-docs__section">

## Preview

</div><div class="api-docs__preview type single">

```ts
type CommandCurrentType<ResponseType,RequestDataType,QueryParamsType,ErrorType,GenericEndpoint,ClientOptions,MappedData> = { data?: CommandData<RequestDataType, MappedData>; headers?: HeadersInit; mockCallback?: (data: RequestDataType) => ClientResponseType<ResponseType, ErrorType>; params?: ExtractRouteParams<GenericEndpoint> | NegativeTypes; queryParams?: QueryParamsType | NegativeTypes; updatedAbortKey?: boolean; updatedCacheKey?: boolean; updatedEffectKey?: boolean; updatedQueueKey?: boolean; used?: boolean } & Partial<NullableKeys<CommandConfig<GenericEndpoint, ClientOptions>>>;
```

</div><div class="api-docs__section">

## Structure

</div><div class="api-docs__returns">

```ts
{
  0: P;
  1: a;
  2: r;
  3: t;
  4: i;
  5: a;
  6: l;
  7: <;
  8: [;
  9: P;
  10:  ;
  11: i;
  12: n;
  13:  ;
  14: k;
  15: e;
  16: y;
  17: o;
  18: f;
  19:  ;
  20: T;
  21: ];
  22: -;
  23: ?;
  24: :;
  25:  ;
  26: N;
  27: u;
  28: l;
  29: l;
  30: a;
  31: b;
  32: l;
  33: e;
  34: T;
  35: y;
  36: p;
  37: e;
  38: <;
  39: T;
  40: [;
  41: P;
  42: ];
  43: >;
  44: >;
  data: MappedData extends undefined ? RequestDataType : MappedData | \null\ | \undefined\;
  headers: HeadersInit;
  mockCallback: (data: RequestDataType) => ClientResponseType<ResponseType, ErrorType>;
  params: string extends T ? NegativeTypes : (T extends `${[object Object]}:,${[object Object]}/,${[object Object]}` ? [k in \Param\ | \keyof ExtractRouteParams<Rest>\]: ParamType : (T extends `${[object Object]}:,${[object Object]}` ? [k in Param]: ParamType : NegativeTypes)) | \null\ | \undefined\;
  queryParams: QueryParamsType | \null\ | \undefined\;
  updatedAbortKey: boolean;
  updatedCacheKey: boolean;
  updatedEffectKey: boolean;
  updatedQueueKey: boolean;
  used: boolean;
}
```

</div>