import { createRoute, createRouter, createRouting } from "@reins/router";

import DetailsPage from "../pages/details";
import ListPage from "../pages/list";
import FormPage from "../pages/form";
import { WebsocketsPage } from "../pages/websocket/websocket";

export const routing = createRouter({
  routing: createRouting({
    Dashboard: createRoute({
      path: "/",
    }),
    Details: createRoute({
      path: "/details",
      component: DetailsPage,
    }),
    List: createRoute({
      path: "/list",
      component: ListPage,
    }),
    Form: createRoute({
      path: "/forms",
      component: FormPage,
    }),
    Websockets: createRoute({
      path: "/websockets",
      component: WebsocketsPage,
    }),
  }),
});
