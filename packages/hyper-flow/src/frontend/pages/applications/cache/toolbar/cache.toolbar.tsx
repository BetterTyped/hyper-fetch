import { Input } from "@/components/ui/input";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useCacheStore } from "@/store/applications/cache.store";

export const CacheToolbar = () => {
  const { application } = useDevtools();
  const searchTerm = useCacheStore((state) => state.applications[application.name]?.cacheSearchTerm ?? "");
  const setSearchTerm = useCacheStore((state) => state.setSearchTerm);

  return (
    <div className="pb-3" data-testid="cache-toolbar">
      <Input
        type="search"
        aria-label="Search cache"
        placeholder="Search by cache key"
        value={searchTerm}
        onChange={(e) => setSearchTerm(application.name, e.target.value)}
      />
    </div>
  );
};
