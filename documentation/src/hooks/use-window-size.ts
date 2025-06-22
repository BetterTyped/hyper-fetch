import { useState } from "react";
import { isBrowser } from "motion/react";

import { useWindowEvent } from "./use-window-event";

export type WindowWidthType = number;
export type WindowHeightType = number;
export type UseWindowSizeType = [WindowWidthType, WindowHeightType];

const getSize = (): UseWindowSizeType => [isBrowser ? window.innerWidth : 0, isBrowser ? window.innerHeight : 0];

export const useWindowSize = (onResize?: (size: UseWindowSizeType) => void) => {
  const [windowSize, setWindowSize] = useState<UseWindowSizeType>(getSize);

  const handleResize = () => {
    const size = getSize();
    setWindowSize(size);
    onResize?.(size);
  };

  useWindowEvent("resize", handleResize);

  return windowSize;
};
