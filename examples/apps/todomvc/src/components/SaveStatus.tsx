import { useIsSubmitting } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { client } from "../api/client";

/** One status line for every write of the app, whichever component sent it. */
export const SaveStatus = () => {
  const saving = useIsSubmitting(client);
  const [lastError, setLastError] = useState<string | null>(null);

  // By the time a failed response arrives here, core has already rolled the optimistic change back.
  useEffect(
    () =>
      client.requestManager.events.onResponse(({ request, response }) => {
        if (request.method === "GET") return;
        setLastError(
          response.success ? null : `${response.error?.message ?? "Request failed"}. The change was undone.`,
        );
      }),
    [],
  );

  if (saving > 0) return <small aria-busy="true">Saving {saving} change(s)...</small>;
  if (lastError) return <small className="error">{lastError}</small>;
  return <small className="muted">All changes saved on the server</small>;
};
