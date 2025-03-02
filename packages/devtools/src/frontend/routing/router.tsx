import { createRoute, createRouter, createRouting, RoutingNames } from "@reins/router";

import { makeElectronRouter } from "./electron-adapter";
import { Network } from "../pages/project/network/network";
import { Cache } from "../pages/project/cache/cache";
import { Queues } from "../pages/project/queues/queues";
import { Settings } from "../pages/dashboard/settings/settings";
import { Activities } from "../pages/dashboard/activities/activities";
import { Favorites } from "../pages/dashboard/favorites/favorites";
import { RecentlyVisited } from "../pages/dashboard/recently-visited/recently-visited";
import { Members } from "../pages/dashboard/members/members";
import { Resources } from "../pages/dashboard/resources/resources";
import { Projects } from "../pages/dashboard/projects/projects";
import { Workspace } from "frontend/pages/project/workspace/workspace";

const routing = createRouting({
  dashboard: createRoute({
    path: "/",
    component: Projects,
  }).addRouting({
    projects: createRoute({
      path: "/projects",
      component: Projects,
    }),
    resources: createRoute({
      path: "/resources",
      component: Resources,
    }),
    members: createRoute({
      path: "/members",
      component: Members,
    }),
    settings: createRoute({
      path: "/settings",
      component: Settings,
    }),
    activities: createRoute({
      path: "/activities",
      component: Activities,
    }),
    favorites: createRoute({
      path: "/favorites",
      component: Favorites,
    }),
    recentlyVisited: createRoute({
      path: "/recently-visited",
      component: RecentlyVisited,
    }),
  }),
  project: createRoute({
    path: "/project",
    component: Workspace,
  }).addRouting({
    workspace: createRoute({
      path: "/workspace",
      component: Workspace,
    }),
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
    settings: createRoute({
      path: "/settings",
      component: Settings,
    }),
  }),
});

export const router = makeElectronRouter();

export const { Link, Route, useRoute, useLocation } = createRouter({
  router,
  routing,
});

export type RoutingLocations = RoutingNames<typeof routing>;
