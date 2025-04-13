import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Input } from "frontend/components/ui/input";
import { useQueueStore } from "frontend/store/project/queue.store";

export const QueuesToolbar = () => {
  const { project } = useDevtools();
  const setSearchTerm = useQueueStore((state) => state.setSearchTerm);

  return (
    <div>
      <Input placeholder="Search" onChange={(e) => setSearchTerm(project.name, e.target.value)} />
    </div>
  );
};
