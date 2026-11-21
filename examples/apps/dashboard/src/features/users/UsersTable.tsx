import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { PAGE_SIZE, type SortField, type SortOrder, usersPage } from "../../api/users";

const columns: { field: SortField; label: string }[] = [
  { field: "firstName", label: "Name" },
  { field: "email", label: "Email" },
  { field: "age", label: "Age" },
];

export const UsersTable = () => {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ by: SortField; order: SortOrder }>({ by: "firstName", order: "asc" });

  // Every page and sort is its own cache key. Only query params change, so the rows on screen stay until the
  // next ones arrive, and a page you saw before shows at once.
  const { data, error, loading, refetch } = useFetch(usersPage(page, sort.by, sort.order));
  const pages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const toggleSort = (field: SortField) => {
    setSort((current) => ({
      by: field,
      order: current.by === field && current.order === "asc" ? "desc" : "asc",
    }));
    setPage(0);
  };

  return (
    <article className="table-widget">
      <header className="toolbar">
        <strong>Customers</strong>
        {data && (
          <small className="muted">
            Page {page + 1} of {pages}
          </small>
        )}
      </header>
      {error && (
        <p className="error">
          Could not load customers: {error.message}{" "}
          <button type="button" className="outline secondary" onClick={refetch}>
            Retry
          </button>
        </p>
      )}
      <div className="overflow-auto">
        <table className="striped" aria-busy={loading}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.field} aria-sort={sort.by === column.field ? `${sort.order}ending` : undefined}>
                  <button type="button" className="sort" onClick={() => toggleSort(column.field)}>
                    {column.label} {sort.by === column.field && (sort.order === "asc" ? "▲" : "▼")}
                  </button>
                </th>
              ))}
              <th>Company</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{user.age}</td>
                <td>{user.company.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="toolbar">
        <button type="button" className="outline secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="outline secondary"
          disabled={page + 1 >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </footer>
    </article>
  );
};
