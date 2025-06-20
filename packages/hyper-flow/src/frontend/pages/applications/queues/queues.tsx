import { useShallow } from "zustand/react/shallow";

import { QueuesList } from "./list/queues.list";
import { QueuesDetails } from "./details/queues.details";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStore } from "@/store/applications/queue.store";

export const ApplicationQueues = () => {
  const { application } = useDevtools();
  const detailsId = useQueueStore(useShallow((state) => state.applications[application.name]?.detailsId));

  return (
    <div className="flex relative flex-1 h-full">
      <QueuesList />
      {/* useQueue hook needs a detailsId to be open */}
      {detailsId && <QueuesDetails />}
    </div>
  );
};
