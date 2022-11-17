# useEmitter

```tsx
import { emitMessage } from "sockets/messages";

const {
  emit,
  emitting,
  error,
  connection,
  onEmitted,
  onError,
  onOpen,
  onClose,
  onReconnectionStop,
  reconnect,
  setData,
} = useEmitter(emitMessage);

// ...

return (
  <button onClick={() => emit({ data: "something dynamic", queryParams: { test: 123 }, args: [1, 2, 3] })}>Emit</button>
);
```

# useListener

```tsx
import { listenResponse } from "sockets/messages";

const { data, error, connection, onMessage, onError, onOpen, onClose, onReconnectionStop, reconnect, setData } =
  useListener(listenResponse, { once: true });

// ...

return <div>Last message: {JSON.stringify(data)}</div>;
```
