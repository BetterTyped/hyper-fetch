import { createRoute, createRouter, RoutesNames } from "@reins/router";

import { makeElectronRouter } from "./electron-adapter";
import { Settings } from "../pages/dashboard/settings/settings";
import { Activities } from "../pages/dashboard/activities/activities";
import { Favorites } from "../pages/dashboard/favorites/favorites";
import { RecentlyVisited } from "../pages/dashboard/recently-visited/recently-visited";
import { Members } from "../pages/dashboard/members/members";
import { Projects } from "../pages/dashboard/projects/projects";
// import { Workspaces } from "../pages/dashboard/workspaces/workspaces";
import { WorkspaceDetails } from "../pages/workspace/details/details";
import { WorkspaceSettings } from "frontend/pages/workspace/settings/settings";
import { WorkspaceMocks } from "frontend/pages/workspace/mocks/details";
import { WorkspaceTesting } from "frontend/pages/workspace/testing/testing";
import { WorkspaceDocumentation } from "frontend/pages/workspace/documentation/documentation";
import { WorkspaceApis } from "frontend/pages/workspace/apis/apis";
import { ProjectDetails } from "frontend/pages/project/details/details";
import { ProjectSettings } from "frontend/pages/project/settings/settings";
import { ProjectQueues } from "frontend/pages/project/queues/queues";
import { ProjectNetwork } from "frontend/pages/project/network/network";
import { ProjectCache } from "frontend/pages/project/cache/cache";
import { ProjectRequests } from "../pages/project/requests/requests";
import { WorkspaceLayout } from "frontend/pages/workspace/_layout/layout";
import { DashboardLayout } from "frontend/pages/dashboard/_layout/layout";

const routes = createRoute({
  path: "/",
  component: Projects,
  layout: DashboardLayout,
  error: () => <div>This is Error</div>,
}).addChildren({
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

  workspace: createRoute({
    path: "/workspace/:workspaceId",
    component: WorkspaceDetails,
    layout: WorkspaceLayout,
  }).addChildren({
    apis: createRoute({
      path: "/apis",
      component: WorkspaceApis,
    }),
    documentation: createRoute({
      path: "/documentation",
      component: WorkspaceDocumentation,
    }),
    testing: createRoute({
      path: "/testing",
      component: WorkspaceTesting,
    }),
    mocks: createRoute({
      path: "/mocks",
      component: WorkspaceMocks,
    }),
    settings: createRoute({
      path: "/settings",
      component: WorkspaceSettings,
    }),
  }),
  projects: createRoute({
    path: "/projects",
    component: Projects,
  }).addChildren({
    details: createRoute({
      path: "/project/:projectName",
      component: ProjectDetails,
    }).addChildren({
      requests: createRoute({
        path: "/requests",
        component: ProjectRequests,
      }),
      network: createRoute({
        path: "/network",
        component: ProjectNetwork,
      }),
      cache: createRoute({
        path: "/cache",
        component: ProjectCache,
      }),
      queues: createRoute({
        path: "/queues",
        component: ProjectQueues,
      }),
      settings: createRoute({
        path: "/settings",
        component: ProjectSettings,
      }),
    }),
  }),
});

export const router = makeElectronRouter();

export const { Link, Application, useRoute, useLocation } = createRouter({
  router,
  routes,
});

export type RoutingLocations = RoutesNames<typeof routes>;
