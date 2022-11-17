# Usage

Initialize

```ts
import { Socket } from "@hyper-fetch/sockets"

export const socket = new Socket({
  baseUrl: string;
  client: ClientType;
  reconnect: number;
  reconnectTime?: number;
})

```

Methods

`setClient` `setListenerConfig` `setEmitterConfig` `setHeaderMapper` `setDebug` `setLogger` `setLoggerSeverity`
`setPayloadMapper` `setQueryParamsConfig` `setStringifyQueryParams`

`onAuth`

`onError`
