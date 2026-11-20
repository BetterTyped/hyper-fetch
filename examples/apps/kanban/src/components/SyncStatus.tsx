import { useIsSubmitting } from "@hyper-fetch/react";
import { useSyncExternalStore } from "react";

import { activity } from "../api/activity";
import { client } from "../api/client";

export const SyncStatus = () => {
  // Counts the writes still waiting for the server, from every component.
  const saving = useIsSubmitting(client);
  const entries = useSyncExternalStore(activity.subscribe, activity.get);
  const failed = entries[0]?.tone === "failed";

  let status = <mark className="saved">All changes saved</mark>;
  if (saving > 0) status = <span aria-busy="true">Saving {saving} change(s)...</span>;
  else if (failed) status = <mark className="failed">Last change failed and was undone</mark>;

  return (
    <article className="sync">
      <header>{status}</header>
      {entries.length === 0 && <small className="muted">Drag a card, add one or open a second tab.</small>}
      <ol>
        {entries.map((entry) => (
          <li key={entry.id} className={entry.tone}>
            {entry.text} <small className="muted">{entry.time}</small>
          </li>
        ))}
      </ol>
    </article>
  );
};
