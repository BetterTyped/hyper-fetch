import { createContext } from "frontend/utils/context";

export const [AppProvider, useAppContext] = createContext("AppProvider", {
  height: 0,
  width: 0,
});
