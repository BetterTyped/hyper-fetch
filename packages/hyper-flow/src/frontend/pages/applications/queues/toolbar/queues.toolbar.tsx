import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { Input } from "@/components/ui/input";
import { useQueueStore } from "@/store/applications/queue.store";

export const QueuesToolbar = () => {
  const { application } = useDevtools();
  const setSearchTerm = useQueueStore((state) => state.setSearchTerm);

  return (
    <div>
      <Input placeholder="Search" onChange={(e) => setSearchTerm(application.name, e.target.value)} />
    </div>
  );
};
