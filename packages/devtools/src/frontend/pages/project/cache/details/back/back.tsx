import { XIcon } from "lucide-react";

import { Button } from "frontend/components/ui/button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useCacheStore } from "frontend/store/project/cache.store";

export const Back = () => {
  const { project } = useDevtools();
  const setDetailsCacheKey = useCacheStore((state) => state.openDetails);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDetailsCacheKey({ project: project.name, cacheKey: "" })}>
      <XIcon className="h-4 w-4" />
    </Button>
  );
};
