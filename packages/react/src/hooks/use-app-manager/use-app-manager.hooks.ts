import { useDidMount } from "@better-hooks/lifecycle";
import type { ClientInstance } from "@hyper-fetch/core";
import type { UseAppManagerReturnType } from "hooks/use-app-manager";
import { useState } from "react";

/** Track the application's online/offline and focus/blur state through the client's AppManager. */
export const useAppManager = <Client extends ClientInstance>(client: Client): UseAppManagerReturnType => {
  const [online, setIsOnline] = useState(client.appManager.isOnline);
  const [focused, setIsFocused] = useState(client.appManager.isFocused);

  const mountEvents = () => {
    const unmountIsOnline = client.appManager.events.onOnline(() => setIsOnline(true));
    const unmountIsOffline = client.appManager.events.onOffline(() => setIsOnline(false));
    const unmountIsFocus = client.appManager.events.onFocus(() => setIsFocused(true));
    const unmountIsBlur = client.appManager.events.onBlur(() => setIsFocused(false));

    return () => {
      unmountIsOnline();
      unmountIsOffline();
      unmountIsFocus();
      unmountIsBlur();
    };
  };

  const setOnline = (isOnline: boolean) => {
    client.appManager.setOnline(isOnline);
  };

  const setFocused = (isFocused: boolean) => {
    client.appManager.setFocused(isFocused);
  };

  useDidMount(mountEvents);

  return { isOnline: online, isFocused: focused, setOnline, setFocused };
};
