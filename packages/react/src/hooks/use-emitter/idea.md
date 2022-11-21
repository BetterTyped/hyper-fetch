# useEmitter

```tsx
import { emitMessage } from "sockets/messages";

const {
  emit,
  emitting,
  error,
  connected,
  reconnecting,
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
