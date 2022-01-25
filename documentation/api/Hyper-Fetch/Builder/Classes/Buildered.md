# Buildered

<p style={{color: "var(--ifm-footer-link-color)"}}>API documentation for the FetchBuilder class.</p>

:::caution

This class is deprecated and might be removed soon.

:::

## Details

`Cache` class should be initialized per every command instance(not modified with params or queryParams). This way we
create container which contains different requests to the same endpoint. With this segregation of data we can keep
paginated data, filtered data, without overriding it between not related fetches. Key for interactions should be
generated later in the hooks with getCommandKey util function, which joins the stringified values to create isolated
space.

## Import

```tsx
import { FetchBuilder } from "@better-typed/hyper-fetch";
```

## Example

```tsx
import { sum } from "../src";

describe("blah", () => {
  it("works", () => {
    expect(sum(1, 1)).toEqual(2);
  });
});
```

## Parameters

| name | type | default | description |
| ---- | ---- | ------- | ----------- |
| 1    | 1    | 1       | 1           |
| 1    | 1    | 1       | 1           |

## Methods

### `modifyHeaders()`

```tsx
modifyHeaders(command: FetchCommand): Promise<FetchCommand>
```

Modify the headers of the command instance

:::info

This class is deprecated and might be removed soon.

:::

### `setHeaders()`

```tsx
setHeaders(command: FetchCommand): FetchCommand
```

Set the headers of the command instance

:::tip

This class is deprecated and might be removed soon.

:::

## Additional links

-[somethig](something)
