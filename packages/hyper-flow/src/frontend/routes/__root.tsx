import { createRootRoute } from "@tanstack/react-router";

import { App } from "@/components/app/app";
import { AppError } from "@/components/errors/app-error";
import { NotFound } from "@/components/no-content/not-found";
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
