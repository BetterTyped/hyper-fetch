import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

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
  return <RouterProvider router={router} history={memoryHistory} />;
}
