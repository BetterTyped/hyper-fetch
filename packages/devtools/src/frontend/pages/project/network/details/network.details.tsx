import { useMemo } from "react";
import { TrashIcon } from "lucide-react";

import { Back } from "./back/back";
import { getStatus, getStatusColor, RequestStatusIcon, Status } from "frontend/utils/request.status.utils";
import { Separator } from "frontend/components/separator/separator";
import { Button } from "frontend/components/ui/button";
import { Table, TableBody, TableRow, TableCell } from "frontend/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "frontend/components/ui/collapsible";
import { Badge } from "frontend/components/ui/badge";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Sheet, SheetContent } from "frontend/components/ui/sheet";
import { JSONViewer } from "frontend/components/json-viewer/json-viewer";

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
    <Sheet open={!!item} onOpenChange={() => removeNetworkRequest(item?.requestId)}>
      <SheetContent side="right" className="w-[70%] max-w-full p-0">
        <div className="flex items-center border-b p-4">
          <Back />
          <Separator className="mx-2 h-4" />
          <div
            className="flex items-center gap-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color }}
          >
            <RequestStatusIcon status={status} className="translate-y-[1px]" />
            {item.request.endpoint}
          </div>
        </div>
        {/* <ScrollArea className="h-[calc(100vh-4rem)]"> */}
        <div className="p-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Request URL:</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.request.endpoint}</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Request Method:</TableCell>
                <TableCell>
                  <Badge variant="secondary">{String(item.request.method)}</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Status Code:</TableCell>
                <TableCell>
                  <Badge variant={item.isSuccess ? "default" : "destructive"}>
                    {String(item.response?.status ?? "")}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Request ID:</TableCell>
                <TableCell>
                  <Badge variant="outline">{String(item.requestId)}</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {!!item.details?.retries && <Badge variant="secondary">Retried Request ({item.details.retries})</Badge>}
          {item.request.isMockerEnabled && !!item.request.unsafe_mock && <Badge variant="secondary">Mocked</Badge>}

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="destructive" size="sm" onClick={remove}>
              <TrashIcon className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>

          <Collapsible className="mt-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium">
              Request
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4">
              <JSONViewer data={config} sortObjectKeys />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="mt-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium">
              Payload
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4">
              <JSONViewer
                data={{
                  payload: item.request.payload,
                  params: item.request.params,
                  queryParams: item.request.queryParams,
                  headers: item.request.headers,
                }}
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="mt-4" defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium">
              Response
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4">
              <JSONViewer data={item.response} />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="mt-4" defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium">
              Processing Details
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4">
              <JSONViewer data={item.details} />
            </CollapsibleContent>
          </Collapsible>
        </div>
        {/* </ScrollArea> */}
      </SheetContent>
    </Sheet>
  );
};
