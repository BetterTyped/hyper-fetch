import { QueuesList } from "./list/queues.list";
import { QueuesDetails } from "./details/queues.details";

export const ProjectQueues = () => {
  return (
    <div className="flex relative flex-1 h-full">
      <QueuesList />
      <QueuesDetails />
    </div>
  );
};
