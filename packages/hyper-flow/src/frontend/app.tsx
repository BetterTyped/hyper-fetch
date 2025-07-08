import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { useTracking } from "./store/general/tracking.store";
import { useEffect } from "react";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const memoryHistory = createMemoryHistory({
  initialEntries: ["/"], // Pass your initial url
});

export function App() {
  const { firstOpen, setFirstOpen } = useTracking();

  useEffect(() => {
    if (!firstOpen) {
      setFirstOpen(false);
    }
  }, [firstOpen]);

  return <RouterProvider router={router} history={memoryHistory} />;
}
