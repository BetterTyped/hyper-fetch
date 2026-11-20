import { Input } from "@/components/ui/input";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStore } from "@/store/applications/queue.store";

export const QueuesToolbar = () => {
  const { application } = useDevtools();
  const searchTerm = useQueueStore((state) => state.applications[application.name].searchTerm);
  const setSearchTerm = useQueueStore((state) => state.setSearchTerm);

  return (
    <div className="pb-3" data-testid="queues-toolbar">
      <Input
        type="search"
        aria-label="Search queues"
        placeholder="Search by query key"
        value={searchTerm}
        onChange={(e) => setSearchTerm(application.name, e.target.value)}
      />
    </div>
  );
};
