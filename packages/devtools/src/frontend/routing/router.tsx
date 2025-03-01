import { createRoute, createRouter, createRouting } from "@reins/router";

import { makeElectronRouter } from "./electron-adapter";
import { Dashboard } from "../pages/dashboard/dashboard";
import { Devtools } from "../pages/devtools/devtools";
import { Network } from "../pages/devtools/network/network";
import { Cache } from "../pages/devtools/cache/cache";
import { Queues } from "../pages/devtools/queues/queues";
import { Workspace } from "../pages/workspace/workspace";

const routes = createRouting({
  dashboard: createRoute({
    path: "/",
    component: Dashboard,
  }),
  workspace: createRoute({
    path: "/workspace",
    component: Workspace,
  }),
  devtools: createRoute({
    path: "/devtools",
    component: Devtools,
  }).addRouting({
    network: createRoute({
      path: "/network",
      component: Network,
    }),
    cache: createRoute({
      path: "/cache",
      component: Cache,
    }),
    queues: createRoute({
      path: "/queues",
      component: Queues,
    }),
  }),
});

export const { Link, Route, useRoute } = createRouter({
  router: makeElectronRouter(),
  routing: routes,
});
