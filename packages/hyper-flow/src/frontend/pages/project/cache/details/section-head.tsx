import { Chip } from "frontend/components/ui/chip";
import { Key } from "frontend/components/ui/key";
import { DevtoolsCacheEvent } from "frontend/context/projects/types";

export const SectionHead = ({ item, stale }: { item: DevtoolsCacheEvent; stale: boolean }) => {
  return (
    <div className="flex flex-row items-center gap-3 my-3 px-2">
      <Key value={item.cacheKey} type="cache" className="text-2xl" />
      <div className="flex-1" />
      <Chip color={stale ? "orange" : "green"}>{stale ? "Stale" : "Fresh"}</Chip>
      {item.cacheData.hydrated && <Chip color="green">Hydrated</Chip>}
    </div>
  );
};
