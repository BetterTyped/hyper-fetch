import { useMemo } from "react";
import { BadgeCheck, Hexagon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { TableCell, TableRow } from "frontend/components/ui/table";
import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getStatus, RequestStatusIcon } from "frontend/utils/request.status.utils";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";
import { Method } from "frontend/components/ui/method";
import { Badge } from "frontend/components/ui/badge";

export const RequestRow = ({ item, clickable = true }: { item: DevtoolsRequestEvent; clickable?: boolean }) => {
  const { project } = useDevtools();
  const { openDetails, detailsRequestId } = useNetworkStore(
    useShallow((state) => ({
      openDetails: state.openDetails,
      detailsRequestId: state.projects[project.name].detailsRequestId,
    })),
  );

  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  const handleClick = () => {
    if (clickable) {
      openDetails({ project: project.name, requestId: item.requestId ?? "" });
    }
  };

  return (
    <TableRow
      onClick={handleClick}
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md ${
        item.requestId === detailsRequestId ? "ring-1 ring-inset ring-blue-400" : ""
      }`}
    >
      <TableCell className="max-w-fit">
        <RequestStatusIcon status={status} />
      </TableCell>

      <TableCell className="text-sm font-medium">
        <div className="flex items-center gap-2">
          <Method method={item.request.method} />
          <span>{item.request.endpoint}</span>
        </div>
      </TableCell>

      <TableCell className="text-sm font-light">
        {item.request.cache ? (
          <Badge variant="default">
            <BadgeCheck className="min-w-4 min-h-4" />
            Cached
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Hexagon className="min-w-4 min-h-4" />
            Not cached
          </Badge>
        )}
      </TableCell>

      <TableCell className="text-sm font-light">
        <div>{new Date(item.timestamp).toLocaleTimeString()} </div>
      </TableCell>
      <TableCell className="text-sm font-light">
        {item.details ? <div>{item.details.responseTimestamp - item.details.requestTimestamp}ms</div> : <div>-</div>}
      </TableCell>
    </TableRow>
  );
};
