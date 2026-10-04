import type { ClientInstance } from "@hyper-fetch/core";
import type { UseAppManagerReturnType } from "hooks/use-app-manager";
import { useEffect, useState } from "react";

/** Track the application's online/offline and focus/blur state through the client's AppManager. */
export const useAppManager = <Client extends ClientInstance>(client: Client): UseAppManagerReturnType => {
  const [online, setIsOnline] = useState(client.appManager.isOnline);
  const [focused, setIsFocused] = useState(client.appManager.isFocused);

  const mountEvents = () => {
    // Catch up with anything that happened between the render and the subscription
    setIsOnline(client.appManager.isOnline);
    setIsFocused(client.appManager.isFocused);

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

  // Plain effect on purpose - StrictMode runs mount, cleanup and mount again,
  // so a mount-once guard would leave the hook without any subscriptions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(mountEvents, [client]);

  return { isOnline: online, isFocused: focused, setOnline, setFocused };
};
