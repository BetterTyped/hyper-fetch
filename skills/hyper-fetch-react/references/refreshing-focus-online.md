# Refreshing, focus, blur and online state

All of these read the client's `AppManager` (focus and online state). In the browser it works out of the box; React
Native and Electron need a custom `AppManager` (below).

## Polling

```tsx
import { Time } from "@hyper-fetch/core";

const { data } = useFetch(getPrices, {
  refresh: true,
  refreshTime: Time.SEC * 10,
  refetchBlurred: false, // pause while the tab or app is in the background
});
```

- One timer per hook (also in StrictMode). It counts `refreshTime` from the last fetch trigger: mount, key or
  `dependencies` change, `disabled` / `refresh` / `refreshTime` change, `refetch()`, and focus / blur / reconnect
  refetches all restart the countdown, so a scheduled refresh never fires right after a manual one.
- When the timer fires and a request for that queue is already running or queued, no extra request is sent.
- `refetchBlurred` (default `true`) keeps polling while blurred; `false` skips refreshes while blurred and resumes after
  focus.
- Offline: one request is queued and sent once the network returns (no pile-up).
- Disabled hooks never poll; turning `refresh` off or unmounting clears the timer.
- `useInfiniteFetch` has the same options; a refresh refetches every loaded page.
- For realtime data with many clients, prefer server push (`hyper-fetch-sockets`) over short polling intervals.

## Focus, blur, reconnect

```tsx
const { data } = useFetch(getNotifications, {
  refetchOnFocus: true, // user comes back to the tab / app
  refetchOnReconnect: true, // network restored
  refetchOnBlur: false, // user leaves (rarely useful)
});
```

- All default to `false`. Set them app-wide with `<Provider config={{ useFetchConfig: { refetchOnFocus: true } }}>`.
- One fetch per event per hook; it joins an already running request of the same key instead of sending another.
- Option changes apply immediately (read at event time). Disabled hooks ignore the events.
- Each event refetch restarts the polling countdown.
- With pending optimistic mutations on the key, a focus refetch that started before they settled is discarded.

## Offline requests

Requests have `offline: true` by default: a request that fails because the connection dropped stays in the queue and is
sent again once online. Hooks see this as `onOfflineError` / `onSubmitOfflineError` (not `onError`), `submit()` resolves
only with the final response, and `useFetch` mounted while offline sends when the network returns. Use
`request.setOffline(false)` to fail immediately instead.

## Reading the state in UI

```tsx
import { useAppManager } from "@hyper-fetch/react";

function OfflineBanner() {
  const { isOnline, isFocused } = useAppManager(client);
  if (isOnline) return null;
  return <Banner>You are offline. Changes will be sent when you reconnect.</Banner>;
}
```

`useAppManager(client)` returns `{ isOnline, isFocused, setOnline, setFocused }`. The setters change the client state
(and trigger the refetch options), useful for tests or for wiring a custom signal.

## Browser defaults

Focus follows `visibilitychange` (hidden document = blurred) plus window `focus` / `blur`. Online follows window
`online` / `offline`; the initial state comes from `navigator.onLine`. No setup needed.

## React Native

```ts
import { AppManager, Client } from "@hyper-fetch/core";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";

export const client = new Client({
  url: "https://api.example.com",
  appManager: () =>
    new AppManager({
      // A getter: sync values apply at once, async ones start as false and apply when resolved
      initiallyOnline: () => NetInfo.fetch().then((state) => !!state.isConnected),
      onlineEvent: (setOnline) => NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
      initiallyFocused: () => AppState.currentState === "active",
      focusEvent: (setFocused) => {
        const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
          setFocused(status === "active");
        });
        return () => subscription.remove();
      },
    }),
});
```

- `initiallyOnline` / `initiallyFocused` accept `boolean | () => boolean | Promise<boolean>` (pass a function, not a
  promise). Event subscribers return their cleanup.
- With this setup `refetchOnFocus` means "app returned to foreground" and `refetchOnReconnect` follows NetInfo.
- Persistent dispatcher queues (for example MMKV via `new Dispatcher({ storage })` on `fetchDispatcher` /
  `submitDispatcher`) keep offline mutations across restarts; avoid them in multi-tab browsers. See `hyper-fetch-core`.
- Infinite lists: call `fetchNextPage` from `FlatList`'s `onEndReached`.

## Electron

The renderer works like a browser. For reliable signals, forward main-process events over IPC (exposed through a preload
script):

```ts
export const client = new Client({
  url: "https://api.example.com",
  appManager: () =>
    new AppManager({
      initiallyOnline: navigator.onLine,
      onlineEvent: (setOnline) => window.electronApi.onOnlineStatus(setOnline), // returns an unsubscribe
      focusEvent: (setFocused) => window.electronApi.onWindowFocus(setFocused),
    }),
});
```

In the main process send the state from `BrowserWindow` `focus` / `blur` events and a connectivity check (for example
the `is-online` package) with `webContents.send`. `window.electronApi` is your own preload bridge; type it in a `.d.ts`.

Docs: https://hyperfetch.bettertyped.com/docs/guides/react/basics/refreshing,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/window-focus-blur,
https://hyperfetch.bettertyped.com/docs/react/environments/react-native,
https://hyperfetch.bettertyped.com/docs/react/environments/electron
