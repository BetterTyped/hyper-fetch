import { createBrowserRouter, Outlet, RouterProvider } from "react-router";

import { NetworkLog } from "./components/NetworkLog";
import { CharacterList } from "./features/characters/CharacterList";
import { CharacterPage } from "./features/characters/CharacterPage";

const Layout = () => (
  <main className="container">
    <hgroup>
      <h1>Rick and Morty explorer</h1>
      <p>Hover a character to prefetch it, open it, then go back. The network log shows what skipped the cache.</p>
    </hgroup>
    <div className="layout">
      <Outlet />
      <aside>
        <NetworkLog />
      </aside>
    </div>
  </main>
);

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: CharacterList },
      { path: "characters/:characterId", Component: CharacterPage },
    ],
  },
]);

export const App = () => <RouterProvider router={router} />;
