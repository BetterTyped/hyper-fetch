"use client";

import { SnackbarProvider } from "notistack";

import { client } from "../api";

export function Providers({ children, fallbacks }: { children: React.ReactNode; fallbacks?: any[] }) {
  if (fallbacks) {
    client.hydrate(fallbacks);
  }

  return (
    <SnackbarProvider maxSnack={6} autoHideDuration={1000} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
      {children}
    </SnackbarProvider>
  );
}
