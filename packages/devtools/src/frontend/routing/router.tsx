import { createRoute, createRouter, createRouting, RoutingNames } from "@reins/router";

import { makeElectronRouter } from "./electron-adapter";
import { Settings } from "../pages/dashboard/settings/settings";
import { Activities } from "../pages/dashboard/activities/activities";
import { Favorites } from "../pages/dashboard/favorites/favorites";
import { RecentlyVisited } from "../pages/dashboard/recently-visited/recently-visited";
import { Members } from "../pages/dashboard/members/members";
import { Resources } from "../pages/dashboard/resources/resources";
import { Workspaces } from "../pages/dashboard/workspaces/workspaces";
import { Details } from "../pages/workspace/details/details";
import { Queues } from "frontend/pages/workspace/queues/queues";
import { Network } from "frontend/pages/workspace/network/network";

const routing = createRouting({
  dashboard: createRoute({
    path: "/",
    component: Workspaces,
  }).addRouting({
    projects: createRoute({
      path: "/projects",
      component: Workspaces,
    }),
    onlineProjects: createRoute({
      path: "/onlineProjects",
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
  workspace: createRoute({
    path: "/workspace/:workspaceId",
    component: Details,
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
