import { QueuesList } from "./list/queues.list";
import { QueuesDetails } from "./details/queues.details";
import { Content } from "frontend/components/content/content";

export const ProjectQueues = () => {
  return (
    <div className="flex relative flex-1 h-full">
      <QueuesList />
      <QueuesDetails />
    </div>
  );
};
