import { useFetch } from "@hyper-fetch/react";

import { type CardStatus, getCards } from "../../api/cards";
import { Column } from "./Column";

const columns: { status: CardStatus; title: string }[] = [
  { status: "todo", title: "To do" },
  { status: "doing", title: "In progress" },
  { status: "done", title: "Done" },
];

export const Board = () => {
  // One request holds the whole board. Moves, edits and the other tabs all change this cache entry.
  const { data, error, loading, refetch } = useFetch(getCards);

  if (loading && !data) return <p aria-busy="true">Loading the board...</p>;
  if (error && !data) {
    return (
      <p className="error">
        Could not load the board: {error.message}{" "}
        <button type="button" className="outline" onClick={refetch}>
          Try again
        </button>
      </p>
    );
  }

  return (
    <div className="board">
      {columns.map((column) => (
        <Column key={column.status} {...column} cards={data?.filter((card) => card.status === column.status) ?? []} />
      ))}
    </div>
  );
};
