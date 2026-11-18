"use client";

import { SnackbarProvider } from "notistack";

// Server data is passed with the `Hydrate` component next to the components that use it - see `app/ssr`
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider maxSnack={6} autoHideDuration={1000} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
      {children}
    </SnackbarProvider>
  );
}
