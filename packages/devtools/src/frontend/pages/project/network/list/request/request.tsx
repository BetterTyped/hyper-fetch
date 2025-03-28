import { useMemo } from "react";

import * as Table from "frontend/components/table/table";
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
    <Table.Row
      tabIndex={0}
      role="button"
      onClick={() => setDetailsRequestId(item.requestId)}
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
        item.requestId === detailsRequestId ? "ring-1 ring-inset ring-blue-400" : ""
      }`}
    >
      <Table.Cell className="text-sm font-light px-2 first:pl-3 last:pr-3">
        <div className="flex items-center gap-1">
          <RequestStatusIcon status={status} />
          <span>{item.request.endpoint}</span>
        </div>
      </Table.Cell>

      <Table.Cell className="text-sm font-light px-2 first:pl-3 last:pr-3">{String(item.request.method)}</Table.Cell>

      <Table.Cell className="text-sm font-light px-2 first:pl-3 last:pr-3">
        {String(item.response?.success ?? "")}
      </Table.Cell>

      <Table.Cell className="text-sm font-light px-2 first:pl-3 last:pr-3">
        <div>
          {new Date(item.triggerTimestamp).toLocaleTimeString()}{" "}
          {!!item.details?.responseTimestamp && (
            <span className="text-gray-700 dark:text-gray-300">
              ({item.details.responseTimestamp - item.triggerTimestamp}ms)
            </span>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};
