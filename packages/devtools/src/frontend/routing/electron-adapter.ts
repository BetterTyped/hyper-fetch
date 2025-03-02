import { RouterInstance, Router, LocatorType, NavigatorType, MoveType, getRelativePath } from "@reins/router";

export enum HistoryEvents {
  POP = "popstate",
  PUSH = "pushState",
  REPLACE = "replaceState",
  HASH_CHANGE = "hashchange",
}

const routerState = {
  history: [
    {
      path: "/",
      search: "",
    },
  ],
};

export const makeElectronNavigator = (router: RouterInstance): NavigatorType => {
  const emitEvent = () => {
    router.listeners.forEach((listener) => {
      listener();
    });
  };

  const locator: LocatorType = () => {
    const activePage = routerState.history[routerState.history.length - 1];

    const path = getRelativePath(router.base, activePage.path);

    return { path, search: activePage.search };
  };

  const back = () => {
    if (routerState.history.length > 1) {
      routerState.history.pop();
    }
  };

  const navigate: MoveType = (to, options = {}) => {
    const { replace } = options || {};

    const event = replace ? HistoryEvents.REPLACE : HistoryEvents.PUSH;

    if (replace) {
      routerState.history.pop();
    }
    const path = to.split("?")[0];
    const search = to.split("?")[1] || "";
    const activePage = routerState.history[routerState.history.length - 1];

    if (event === HistoryEvents.PUSH && (activePage.path !== path || activePage.search !== search)) {
      routerState.history.push({ path, search });
    } else {
      routerState.history[routerState.history.length - 1] = { path, search };
    }

    emitEvent();
  };

  return {
    locator,
    navigate,
    back,
  };
};

export const makeElectronRouter = () => {
  const router = new Router({
    name: "electron",
    getNavigator: makeElectronNavigator,
  });

  return router;
};
