import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { TableCell, TableRow } from "frontend/components/ui/table";
import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getStatus, RequestStatusIcon } from "frontend/utils/request.status.utils";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";
import { Method } from "frontend/components/ui/method";

export const RequestRow = ({ item }: { item: DevtoolsRequestEvent }) => {
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

  return (
    <TableRow
      onClick={() => openDetails({ project: project.name, requestId: item.requestId ?? "" })}
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
        item.requestId === detailsRequestId ? "ring-1 ring-inset ring-blue-400" : ""
      }`}
    >
      <TableCell className="text-sm font-light">
        <div className="flex items-center gap-1">
          <RequestStatusIcon status={status} />
          <span>{item.request.endpoint}</span>
        </div>
      </TableCell>

      <TableCell className="text-sm font-light">
        <Method method={item.request.method} />
      </TableCell>

      <TableCell className="text-sm font-light">{String(item.response?.success ?? "")}</TableCell>
      <TableCell className="text-sm font-light">{String(item.request.cache ?? "")}</TableCell>

      <TableCell className="text-sm font-light">
        <div>
          {new Date(item.timestamp).toLocaleTimeString()}{" "}
          {!!item.details?.responseTimestamp && (
            <span className="text-gray-700 dark:text-gray-300">
              ({item.details.responseTimestamp - item.timestamp}ms)
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
