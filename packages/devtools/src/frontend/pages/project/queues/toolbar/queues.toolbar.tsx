import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Input } from "frontend/components/ui/input";

export const QueuesToolbar = () => {
  const { setProcessingSearchTerm } = useDevtools();

  return (
    <div>
      <Input placeholder="Search" onChange={(e) => setProcessingSearchTerm(e.target.value)} />
    </div>
  );
};
