import { ListXIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { cn } from "@/lib/utils";
import { useNetworkStore } from "@/store/applications/network.store";
import { Status } from "@/utils/request.status.utils";

const filters: { label: string; value: Status | null }[] = [
  { label: "All", value: null },
  { label: "Success", value: Status.SUCCESS },
  { label: "Failed", value: Status.FAILED },
  { label: "In progress", value: Status.IN_PROGRESS },
  { label: "Paused", value: Status.PAUSED },
  { label: "Canceled", value: Status.CANCELED },
  { label: "Removed", value: Status.REMOVED },
];

export const NetworkToolbar = () => {
  const { application } = useDevtools();
  const { searchTerm, filter } = useNetworkStore(
    useShallow((state) => ({
      searchTerm: state.applications[application.name].networkSearchTerm,
      filter: state.applications[application.name].networkFilter,
    })),
  );
  const setNetworkSearchTerm = useNetworkStore((state) => state.setNetworkSearchTerm);
  const setNetworkFilter = useNetworkStore((state) => state.setNetworkFilter);
  const clearNetwork = useNetworkStore((state) => state.clearNetwork);

  return (
    <div className="flex flex-col gap-2 pb-3" data-testid="network-toolbar">
      <div className="flex flex-row items-center gap-2">
        <Input
          type="search"
          aria-label="Search requests"
          placeholder="Search by endpoint, method or key"
          value={searchTerm}
          onChange={(e) => setNetworkSearchTerm({ application: application.name, searchTerm: e.target.value })}
        />
        <Button variant="secondary" onClick={() => clearNetwork({ application: application.name })}>
          <ListXIcon />
          Clear network
        </Button>
      </div>
      <div className="flex flex-row flex-wrap gap-1" role="group" aria-label="Filter by status">
        {filters.map((item) => {
          const active = item.value === filter;
          return (
            <Button
              key={item.label}
              size="sm"
              variant="ghost"
              aria-pressed={active}
              className={cn("h-7 px-2 text-xs", active && "bg-accent text-accent-foreground")}
              onClick={() => setNetworkFilter({ application: application.name, filter: item.value })}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
