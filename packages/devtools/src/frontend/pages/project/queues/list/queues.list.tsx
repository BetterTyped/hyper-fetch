/* eslint-disable react/no-array-index-key */
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Card } from "./card/card";
import { NoContent } from "frontend/components/no-content/no-content";
import { useSearch } from "frontend/hooks/use-search";

export const QueuesList = () => {
  const {
    state: { queues, processingSearchTerm },
  } = useDevtools();

  const { items } = useSearch({
    data: queues,
    searchKeys: ["queryKey"],
    searchTerm: processingSearchTerm,
  });

  if (!items.length) {
    return <NoContent text="Make some request to see them here!" />;
  }

  return (
    <div className="w-full flex-1 overflow-y-auto">
      <div className="flex flex-row flex-wrap gap-2.5">
        {items.map((queue, index) => {
          return <Card key={index} queue={queue} />;
        })}
      </div>
    </div>
  );
};
