import { Input } from "frontend/components/ui/input";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const CacheToolbar = () => {
  const { setCacheSearchTerm } = useDevtools();

  return (
    <>
      <Input
        type="search"
        placeholder="Search"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCacheSearchTerm(e.target.value)}
      />
      {/* Toolbar: Show active - only with emitter observers (hooks) */}
    </>
  );
};
