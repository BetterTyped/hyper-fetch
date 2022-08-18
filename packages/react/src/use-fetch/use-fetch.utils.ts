import { CommandInstance } from "@better-typed/hyper-fetch";

import { UseTrackedStateType } from "helpers";

export const getRefreshTime = (refreshTime: number, state?: UseTrackedStateType<CommandInstance>) => {
  if (state) {
    const timeDiff = Date.now() - +state.timestamp;
    return timeDiff < refreshTime ? refreshTime - timeDiff : refreshTime;
  }
  return refreshTime;
};
