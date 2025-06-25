# client-generic-types

This rule extends typescript functionality in tracing the issues with object-like generic types.

## Errors ⛔️

```tsx
import { createClient } from "@hyper-fetch/core";

const someClient = createClient<{ nonExistingGenericType: any }>({ url: "http://localhost:3000" }); // Error: Unexpected generic type(s) found: nonExistingGenericType
```

```tsx
import { createClient } from "@hyper-fetch/core";
const someClient = createClient<{}>({ url: "http://localhost:3000" }); // Error: Generic type provided to createClient is empty
```

```tsx
import { createClient } from "@hyper-fetch/core";
const someClient = createClient<unknown>({ url: "http://localhost:3000" }); // Error: Generic type provided to createClient is not matching the expected object-like format
```
