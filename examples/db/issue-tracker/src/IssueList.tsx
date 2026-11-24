import { and, eq, type ExpressionNode, type QueryExplanation } from "@hyper-fetch/db";
import { useLiveQuery } from "@hyper-fetch/react";
import { useEffect, useMemo, useState } from "react";

import { db, type Status } from "./db";

export type Filters = {
  projectId: string;
  status: Status | "all";
  /** A user id, `"anyone"` or `"unassigned"` */
  assignee: string;
  search: string;
};

/**
 * One query for the whole list. The loader declares `projectId` and `status`, so those are sent. The assignee is not
 * declared, so it runs on the rows the db holds.
 */
const issuesQuery = ({ projectId, status, assignee }: Filters) =>
  db.issueSummary
    .where((issue) =>
      and(
        eq(issue.projectId, projectId),
        ...(status === "all" ? [] : [eq(issue.status, status)]),
        ...(assignee === "anyone" ? [] : [eq(issue.assigneeId, assignee === "unassigned" ? null : assignee)]),
      ),
    )
    .orderBy((issue) => issue.updatedAt, "desc")
    // Adds the assignee's row to each issue. The users of the whole list load in one request.
    .join("assignee", db.user, (issue) => issue.assigneeId);

const labels: Record<Status, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In progress",
  done: "Done",
};
export const statusLabel = (status: Status) => labels[status];

export const IssueList = ({
  filters,
  selectedId,
  onSelect,
}: {
  filters: Filters;
  selectedId: string | undefined;
  onSelect: (issueId: string) => void;
}) => {
  // Queries are compared by structure, so `useLiveQuery` needs no memo. The effect below does.
  const query = useMemo(() => issuesQuery(filters), [filters]);
  const { data, status, isFetching } = useLiveQuery(query);

  // explain() describes the mounted query, so read it after the hook subscribed, and again when the rows change
  const [plan, setPlan] = useState<QueryExplanation>();
  useEffect(() => setPlan(query.explain()), [query, data, isFetching]);

  // Text search is a plain filter over the live result: the db operators compare whole values, so no request is sent
  const search = filters.search.trim().toLowerCase();
  const issues = data?.filter((issue) => issue.title.toLowerCase().includes(search));

  return (
    <section>
      {status === "loading" && <p aria-busy="true">Loading issues...</p>}
      {status === "error" && <p>Could not load the issues.</p>}

      <table className="issues">
        <tbody>
          {issues?.map((issue) => (
            <tr
              key={issue.id}
              aria-current={issue.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(issue.id)}
            >
              <td className="muted">{issue.id}</td>
              <td>{issue.title}</td>
              <td>
                <mark className={`status ${issue.status}`}>{statusLabel(issue.status)}</mark>
              </td>
              <td className="muted">{issue.assigneeId ? (issue.assignee?.name ?? "...") : "Unassigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {status === "ready" && issues?.length === 0 && <p className="muted">No issues match.</p>}

      {plan && <QueryPlan plan={plan} search={search} isFetching={isFetching} count={issues?.length} />}
    </section>
  );
};

const symbols = {
  eq: "=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  inArray: "in",
} as const;

/** Prints a condition the way you would write it */
const describe = (node: ExpressionNode): string => {
  if (node.op === "and" || node.op === "or") return node.items.map(describe).join(` ${node.op} `);
  if (node.op === "not") return `not (${describe(node.item)})`;
  if (node.op === "server") return `${node.name}(${node.field}, ${JSON.stringify(node.value)})`;
  return `${node.field} ${symbols[node.op]} ${JSON.stringify(node.value)}`;
};

/** `explain()` says how the db serves a query: what it sends, what it filters itself and which topics keep it live */
const QueryPlan = ({
  plan,
  search,
  isFetching,
  count,
}: {
  plan: QueryExplanation;
  search: string;
  isFetching: boolean;
  count: number | undefined;
}) => (
  <article className="plan">
    <header>
      Query plan <small className="muted">{isFetching ? "fetching..." : `${count ?? 0} issues`}</small>
    </header>
    <dl>
      <dt>Sent to the server (loader {plan.loader})</dt>
      <dd>{plan.sent.map(describe).join(", ") || "nothing"}</dd>
      <dt>Filtered on the rows the db holds</dt>
      <dd>{plan.local.map(describe).join(", ") || "nothing"}</dd>
      <dt>Filtered in React</dt>
      <dd>{search ? `title contains ${JSON.stringify(search)}` : "nothing"}</dd>
      <dt>Answered without a request</dt>
      <dd>{plan.answeredLocally ? "yes, a loaded list already holds every row it can return" : "no"}</dd>
      <dt>Kept live by</dt>
      <dd>{plan.syncs.map((sync) => `${sync.type}: ${sync.topic}`).join(", ") || "nothing yet"}</dd>
    </dl>
  </article>
);
