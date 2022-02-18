import { useState } from "react";
import { FetchBuilderInstance } from "@better-typed/hyper-fetch";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";

type UseAppManagerType = {
  isFocused: boolean;
  isOnline: boolean;
};

export const useAppManager = <B extends FetchBuilderInstance>(builder: B): UseAppManagerType => {
  const [isOnline, setIsOnline] = useState(builder.appManager.isOnline);
  const [isFocused, setIsFocused] = useState(builder.appManager.isFocused);

  const mountEvents = () => {
    const unmountIsOnline = builder.appManager.events.onOnline(() => setIsOnline(true));
    const unmountIsOffline = builder.appManager.events.onOffline(() => setIsOnline(false));
    const unmountIsFocus = builder.appManager.events.onFocus(() => setIsFocused(true));
    const unmountIsBlur = builder.appManager.events.onBlur(() => setIsFocused(false));

    return () => {
      unmountIsOnline();
      unmountIsOffline();
      unmountIsFocus();
      unmountIsBlur();
    };
  };

  useDidMount(mountEvents);

  return { isOnline, isFocused };
};
