import { useMemo } from "react";

import { TableCell, TableRow } from "frontend/components/ui/table";
import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getStatus, RequestStatusIcon } from "frontend/utils/request.status.utils";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const Request = ({ item }: { item: DevtoolsRequestEvent }) => {
  const {
    setDetailsRequestId,
    state: { detailsRequestId },
  } = useDevtools();

  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  return (
    <TableRow
      onClick={() => setDetailsRequestId(item.requestId)}
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

      <TableCell className="text-sm font-light">{String(item.request.method)}</TableCell>

      <TableCell className="text-sm font-light">{String(item.response?.success ?? "")}</TableCell>

      <TableCell className="text-sm font-light">
        <div>
          {new Date(item.triggerTimestamp).toLocaleTimeString()}{" "}
          {!!item.details?.responseTimestamp && (
            <span className="text-gray-700 dark:text-gray-300">
              ({item.details.responseTimestamp - item.triggerTimestamp}ms)
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
