# Usage

1. Initialize

```ts
import { socket } from "../socket"

const listenResponse = socket.createListener<ResponseType>({
  event: string;
  auth: boolean;
  headers: boolean;
  offline: boolean;
  options: SocketOptions;
})

```

2. Use

```ts
import { listenResponse } from "../message";

const removeListener = listenResponse.on((response) => {
  console.log(response);
  removeListener();
});

listenResponse.once((response) => {
  console.log(response);
});
```
