import { useLiveQuery } from "@hyper-fetch/react";
import type { FormEvent } from "react";

import { db, type Issue, statuses } from "./db";
import { statusLabel } from "./IssueList";
import { log } from "./server";

/**
 * The detail panel reads two collections. The list row is already in the db, so the header shows at once. The full
 * issue loads by key and brings the description.
 */
export const IssueDetail = ({ issueId, onClose }: { issueId: string; onClose: () => void }) => {
  // `.local()` only reads what the db holds: it never sends a request
  const summary = useLiveQuery(db.issueSummary.findOne(issueId).local());
  // Loads `GET /issues/:issueId` through the byKey loader
  const issue = useLiveQuery(db.issue.findOne(issueId));
  // The whole team, for the assignee picker
  const users = useLiveQuery(db.user.orderBy((user) => user.name));

  const header = issue.data ?? summary.data;

  // Writes resolve with the result and never throw. On failure the db has already reverted the list and the panel.
  const save = async (label: string, changes: Partial<Issue>) => {
    const { success } = await db.issue.update(issueId, changes);
    log(success ? `${label}: saved` : `${label}: failed, reverted`);
  };

  const handleTitle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    if (title && title !== header?.title) save(`Rename ${issueId}`, { title });
  };

  if (!header) {
    return <article aria-busy={issue.status === "loading"}>{issue.status === "error" && "Issue not found."}</article>;
  }

  // Edits go through the full issue, so they wait for it. The link carries each one to the list row.
  const editable = Boolean(issue.data);

  return (
    <article className="detail">
      <header>
        <small className="muted">{issueId}</small>
        <button className="secondary outline close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        {/* The key resets the input when the title changes somewhere else */}
        <form key={header.title} onSubmit={handleTitle}>
          <input name="title" aria-label="Title" defaultValue={header.title} disabled={!editable} />
        </form>
      </header>

      <div className="grid">
        <label>
          Status
          <select
            value={header.status}
            disabled={!editable}
            onChange={(event) =>
              save(`Move ${issueId}`, {
                status: statuses.find((status) => status === event.target.value),
              })
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assignee
          <select
            value={header.assigneeId ?? ""}
            disabled={!editable}
            onChange={(event) =>
              save(`Assign ${issueId}`, {
                assigneeId: event.target.value || null,
              })
            }
          >
            <option value="">Unassigned</option>
            {users.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <small className="muted">Priority: {header.priority}</small>
      {issue.data ? (
        <p className="description">{issue.data.description}</p>
      ) : (
        <p aria-busy="true">Loading description...</p>
      )}
    </article>
  );
};
