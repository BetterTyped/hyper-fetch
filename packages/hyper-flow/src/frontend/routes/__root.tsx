import { createRootRoute } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppError } from "@/components/errors/app-error";
import { NotFound } from "@/components/no-content/not-found";
import { App } from "@/components/app/app";

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  errorComponent: AppError,
  component: App,
});
