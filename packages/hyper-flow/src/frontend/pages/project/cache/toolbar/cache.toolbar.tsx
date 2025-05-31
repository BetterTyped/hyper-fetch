import { Input } from "frontend/components/ui/input";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useCacheStore } from "frontend/store/project/cache.store";

export const CacheToolbar = () => {
  const { project } = useDevtools();
  const setSearchTerm = useCacheStore((state) => state.setSearchTerm);

  return (
    <>
      <Input
        type="search"
        placeholder="Search"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(project.name, e.target.value)}
      />
      {/* Toolbar: Show active - only with emitter observers (hooks) */}
    </>
  );
};
