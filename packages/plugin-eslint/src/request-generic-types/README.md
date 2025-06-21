# request-generic-types

This rule extends typescript functionality in tracing the issues with object-like generic types.

## Errors ⛔️

```tsx
import { client } from "./client";

const request = client.createRequest<{ nonExistingGenericType: any }>({ endpoint: "/api/users" }); // Error: Unexpected generic type(s) found: nonExistingGenericType
```

```tsx
import { client } from "./client";
const request = client.createRequest<{}>({ endpoint: "/api/users" }); // Error: Generic type provided to createRequest is empty
```

```tsx
import { client } from "./client";
const request = client.createRequest<unknown>({ endpoint: "/api/users" }); // Error: Generic type provided to createRequest is not matching the expected object-like format
```
