import { Input } from "@/components/ui/input";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCacheStore } from "@/store/applications/cache.store";

export const CacheToolbar = () => {
  const { application } = useDevtools();
  const setSearchTerm = useCacheStore((state) => state.setSearchTerm);

  return (
    <>
      <Input
        type="search"
        placeholder="Search"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(application.name, e.target.value)}
      />
      {/* Toolbar: Show active - only with emitter observers (hooks) */}
    </>
  );
};
