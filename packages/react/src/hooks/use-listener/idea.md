# useListener

```tsx
import { listenResponse } from "sockets/messages";

const {
  listen, // Reinitialize listener when it's off or something
  data,
  error,
  listening,
  connected,
  reconnecting,
  onMessage,
  onError,
  onOpen,
  onClose,
  onReconnectionStop,
  reconnect,
  setData,
} = useListener(listenResponse, { once: true });

// ...

return <div>Last message: {JSON.stringify(data)}</div>;
```
