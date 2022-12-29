import { useState } from "react";
import { useDidMount } from "@better-hooks/lifecycle";
import { ClientInstance } from "@hyper-fetch/core";

import { UseAppManagerReturnType } from "hooks/use-app-manager";

export const useAppManager = <B extends ClientInstance>(client: B): UseAppManagerReturnType => {
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
