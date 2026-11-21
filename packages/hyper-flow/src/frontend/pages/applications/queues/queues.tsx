import { QueuesDetails } from "./details/queues.details";
import { QueuesList } from "./list/queues.list";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStore } from "@/store/applications/queue.store";

export const ApplicationQueues = () => {
  const { application } = useDevtools();
  const item = useQueueStore((state) => {
    const app = state.applications[application.name];
    return app?.detailsId ? app.queues.get(app.detailsId) : undefined;
  });

  return (
    <div className="flex relative flex-1 h-full">
      <QueuesList />
      {/* useQueue hook needs the queue to be open */}
      {item && <QueuesDetails item={item} />}
    </div>
  );
};
