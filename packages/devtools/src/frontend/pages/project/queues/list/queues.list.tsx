/* eslint-disable react/no-array-index-key */
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Card } from "./card/card";
import { NoContent } from "frontend/components/no-content/no-content";
import { useSearch } from "frontend/hooks/use-search";
import { useQueueStore } from "frontend/store/project/queue.store";

export const QueuesList = () => {
  const { project } = useDevtools();
  const { queues, searchTerm } = useQueueStore((state) => state.projects[project.name]);

  const { items } = useSearch({
    data: Array.from(queues.values()),
    searchKeys: ["queryKey"],
    searchTerm,
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
