import { useAppManager, useIsFetching } from "@hyper-fetch/react";

import { client } from "../api/client";

/** A thin bar at the top while any request of the client is running. */
export const FetchingBar = () => {
  const fetching = useIsFetching(client);
  return (
    <div
      className={fetching > 0 ? "fetching-bar active" : "fetching-bar"}
      role="progressbar"
      aria-busy={fetching > 0}
    />
  );
};

/** The app manager follows the browser's online and offline events. */
export const OfflineBanner = () => {
  const { isOnline } = useAppManager(client);
  if (isOnline) return null;

  return (
    <p className="offline" role="status">
      You are offline. The widgets keep their last data and refresh when the connection is back.
    </p>
  );
};
