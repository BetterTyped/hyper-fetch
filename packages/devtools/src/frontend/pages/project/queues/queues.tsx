import { useShallow } from "zustand/react/shallow";

import { QueuesList } from "./list/queues.list";
import { QueuesDetails } from "./details/queues.details";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useQueueStore } from "frontend/store/project/queue.store";

export const ProjectQueues = () => {
  const { project } = useDevtools();
  const detailsId = useQueueStore(useShallow((state) => state.projects[project.name]?.detailsId));

  return (
    <div className="flex relative flex-1 h-full">
      <QueuesList />
      {/* useQueue hook needs a detailsId to be open */}
      {detailsId && <QueuesDetails />}
    </div>
  );
};
