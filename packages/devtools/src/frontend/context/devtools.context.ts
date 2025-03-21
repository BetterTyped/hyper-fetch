import clsx from "clsx";
import { css } from "goober";
import { Emitter, Listener } from "@hyper-fetch/sockets";
import { ClientInstance, RequestInstance } from "@hyper-fetch/core";

import { createContext } from "frontend/utils/context";

export type Sort = { key: string; order: "asc" | "desc" };

export const cssWrapper = (...params: Parameters<typeof css>) => clsx(css(...params));

export type Workspace = {
  id: string;
  name: string;
  requests?: {
    templates?: any[];
    request: RequestInstance;
  }[];
  client: ClientInstance;
  clientSpecificReceiveMessage: Listener<any, any, any>;
  clientSpecificSendMessage: Emitter<any, any, any>;
};

export const [DevtoolsOnlineProjects, useOnlineProjects] = createContext("DevtoolsSwitcher", {
  projects: {} as Record<string, Workspace>,
  setRequestList: (() => {}) as (projectId: string, requests: RequestInstance[]) => void,
});
