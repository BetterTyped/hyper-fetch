import { useMemo } from "react";
import { TrashIcon } from "lucide-react";

import { Back } from "./back/back";
import { getStatus, getStatusColor, RequestStatusIcon, Status } from "frontend/utils/request.status.utils";
import { Separator } from "frontend/components/separator/separator";
import { Button } from "frontend/components/button/button";
import * as Table from "frontend/components/table/table";
import { Bar } from "frontend/components/bar/bar";
import { Collapsible } from "frontend/components/collapsible/collapsible";
import { RowInfo } from "frontend/components/table/row-info/row-info";
import { Chip } from "frontend/components/chip/chip";
import { JSONViewer } from "frontend/components/json-viewer/json-viewer";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Sidebar } from "frontend/components/sidebar/sidebar";

export const NetworkDetails = () => {
  const {
    removeNetworkRequest,
    state: { requests, detailsRequestId },
  } = useDevtools();

  const item = useMemo(() => {
    if (!detailsRequestId) return null;
    return requests.find((request) => request.requestId === detailsRequestId);
  }, [detailsRequestId, requests]);

  const config = useMemo(() => {
    if (!item) return null;

    const values = JSON.parse(JSON.stringify(item.request));
    delete values.payload;
    delete values.params;
    delete values.queryParams;
    delete values.headers;

    return values;
  }, [item]);

  const status = useMemo(() => {
    if (!item) return Status.REMOVED;
    return getStatus(item);
  }, [item]);

  const color = useMemo(() => {
    return getStatusColor(status, false);
  }, [status]);

  const remove = () => {
    if (item) {
      removeNetworkRequest(item.requestId);
    }
  };

  // TODO NO CONTENT
  if (!item) return null;

  return (
    <Sidebar
      position="right"
      className="absolute flex flex-col inset-y-0 right-0"
      defaultSize={{
        width: "70%",
      }}
      minWidth="400px"
      maxWidth="100%"
      minHeight="100%"
      maxHeight="100%"
    >
      <Bar style={{ flexWrap: "nowrap" }}>
        <Back />
        <Separator style={{ height: "18px", margin: "0 4px 0 0" }} />
        <div
          className="flex items-center gap-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color }}
        >
          <RequestStatusIcon status={status} className="translate-y-[1px]" />
          {item.request.endpoint}
        </div>
        <div className="flex-1" />
      </Bar>
      <div className="overflow-y-auto pb-10">
        <div className="p-2.5">
          <Table.Root>
            <Table.Body>
              <RowInfo label="Request URL:" value={<Chip color="normal">{item.request.endpoint}</Chip>} />
              <RowInfo label="Request Method:" value={<Chip color="blue">{String(item.request.method)}</Chip>} />
              <RowInfo
                label="Status Code:"
                value={<Chip color={item.isSuccess ? "green" : "red"}>{String(item.response?.status ?? "")}</Chip>}
              />
              <RowInfo label="Request ID:" value={<Chip color="gray">{String(item.requestId)}</Chip>} />
            </Table.Body>
          </Table.Root>
          {!!item.details?.retries && <Chip>Retried Request ({item.details.retries})</Chip>}
          {item.request.isMockerEnabled && !!item.request.unsafe_mock && <Chip color="orange">Mocked</Chip>}
          <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 mt-1.5">
            <Button color="gray" onClick={remove}>
              <TrashIcon />
              Remove
            </Button>
          </div>
        </div>
        <Collapsible title="Request">
          <div className="p-2.5">
            <JSONViewer data={config} sortObjectKeys />
          </div>
        </Collapsible>
        <Collapsible title="Payload">
          <div className="p-2.5">
            <JSONViewer
              data={{
                payload: item.request.payload,
                params: item.request.params,
                queryParams: item.request.queryParams,
                headers: item.request.headers,
              }}
            />
          </div>
        </Collapsible>
        <Collapsible title="Response" defaultOpen>
          <div className="p-2.5">
            <JSONViewer data={item.response} />
          </div>
        </Collapsible>
        <Collapsible title="Processing Details" defaultOpen>
          <div className="p-2.5">
            <JSONViewer data={item.details} />
          </div>
        </Collapsible>
      </div>
    </Sidebar>
  );
};
