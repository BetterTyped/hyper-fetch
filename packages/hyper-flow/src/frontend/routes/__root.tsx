import { createRootRoute } from "@tanstack/react-router";

import { AppError } from "@/components/errors/app-error";
import { NotFound } from "@/components/no-content/not-found";
import { App } from "@/components/app/app";
import { Providers } from "@/context/providers";

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  errorComponent: AppError,
  component: () => (
    <Providers>
      <App />
    </Providers>
  ),
});
