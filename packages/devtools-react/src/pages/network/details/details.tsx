import { useMemo } from "react";
import { Resizable } from "re-resizable";

import { DevtoolsRequestEvent } from "devtools.types";
import { Back } from "./back/back";
import { getStatus, getStatusColor, RequestStatusIcon } from "utils/request.status.utils";
import { Separator } from "components/separator/separator";
import { Button } from "components/button/button";
import { Table } from "components/table/table";
import { Toolbar } from "components/toolbar/toolbar";
import { Collapsible } from "components/collapsible/collapsible";
import { RowInfo } from "components/table/row-info/row-info";
import { Chip } from "components/chip/chip";

const nameStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const buttonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const tryStringify = (value: any) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return value;
  }
};

export const Details = ({ item }: { item: DevtoolsRequestEvent }) => {
  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  const color = useMemo(() => {
    return getStatusColor(status);
  }, [status]);

  return (
    <Resizable
      bounds="parent"
      defaultSize={{ width: "60%", height: "100%" }}
      maxWidth="90%"
      minWidth="200px"
      boundsByDirection
      style={{
        position: "absolute",
        top: "29px",
        right: "0px",
        bottom: "0px",
        background: "rgb(32 34 42)",
        borderLeft: "1px solid rgb(61, 66, 74)",
        overflowY: "auto",
        minHeight: "100%",
      }}
    >
      <Toolbar>
        <Back />
        <Separator style={{ height: "18px", margin: "0 12px" }} />
        <div style={{ ...nameStyle, color }}>
          <RequestStatusIcon status={status} />
          {item.request.endpoint}
        </div>
        <div style={{ flex: "1 1 auto" }} />
        <div style={{ ...buttonsStyle, color }}>
          <Button color="primary">Refetch</Button>
          <Button color="secondary">Invalidate</Button>
          <Button color="quaternary">Simulate Loading</Button>
          <Button color="tertiary">Simulate Errors</Button>
          <Button color="error">Remove</Button>
        </div>
      </Toolbar>
      <div style={{ padding: "10px" }}>
        <Table>
          <RowInfo label="Request URL:" value={`${item.request.client.url}${item.request.endpoint}`} />
          <RowInfo label="Request Method:" value={String(item.request.method)} />
          <RowInfo label="Status Code:" value={item.response?.status ? String(item.response.status) : status} />
        </Table>
        {!!item.details?.retries && <Chip>Retried Request ({item.details.retries})</Chip>}
        {item.request.isMockEnabled && !!(item.request.mock || item.request.mockData) && (
          <Chip color="orange">Mocked</Chip>
        )}
      </div>
      <Collapsible title="Request config">
        <div style={{ padding: "10px" }}>
          <Table>
            <RowInfo label="Deduplicate:" value={String(item.request.deduplicate)} />
            <RowInfo label="Deduplicate Time:" value={String(item.request.deduplicateTime)} />
            <RowInfo label="Cancelable:" value={String(item.request.cancelable)} />
            <RowInfo label="Retry:" value={String(item.request.retry)} />
            <RowInfo label="Retry Time:" value={String(item.request.retryTime)} />
            <RowInfo label="Garbage Collection:" value={String(item.request.garbageCollection)} />
            <RowInfo label="Cache:" value={String(item.request.cache)} />
            <RowInfo label="Cache Time:" value={String(item.request.cacheTime)} />
            <RowInfo label="Queued:" value={String(item.request.queued)} />
            <RowInfo label="Offline:" value={String(item.request.offline)} />
            <RowInfo label="Used:" value={String(item.request.used)} />
            <RowInfo label="Cache Key:" value={item.request.cacheKey} />
            <RowInfo label="Queue Key:" value={item.request.queueKey} />
            <RowInfo label="Abort Key:" value={item.request.abortKey} />
            <RowInfo label="Effect Key:" value={item.request.effectKey} />
          </Table>
        </div>
      </Collapsible>
      <Collapsible title="Payload">
        <div style={{ padding: "10px" }}>
          <Table>
            <RowInfo label="Params:" value={tryStringify(item.request.params)} />
            <RowInfo label="Data:" value={tryStringify(item.request.data)} />
            <RowInfo label="Query Params:" value={tryStringify(item.request.queryParams)} />
          </Table>
        </div>
      </Collapsible>
      {item.request.headers && (
        <Collapsible title="Request headers">
          <div style={{ padding: "10px" }}>
            <Table>
              {Object.entries(item.request.headers).map(([key, value]) => (
                <RowInfo key={key} label={key} value={value} />
              ))}
            </Table>
          </div>
        </Collapsible>
      )}
      {item.response?.extra && (
        <Collapsible title="Response extra" initiallyExpanded>
          <div style={{ padding: "10px" }}>
            <Table>
              {Object.entries(item.response.extra).map(([key, value]) => (
                <RowInfo key={key} label={key} value={tryStringify(value)} />
              ))}
            </Table>
          </div>
        </Collapsible>
      )}
    </Resizable>
  );
};

// endpoint: Endpoint;
// headers?: HeadersInit;
// auth: boolean;
// method: ExtractAdapterMethodType<ExtractClientAdapterType<Client>>;
// params: ExtractRouteParams<Endpoint> | NegativeTypes;
// data: PayloadType<Payload>;
// queryParams: QueryParams | NegativeTypes;
// options?: ExtractAdapterOptionsType<ExtractClientAdapterType<Client>> | undefined;
// cancelable: boolean;
// retry: number;
// retryTime: number;
// garbageCollection: number;
// cache: boolean;
// cacheTime: number;
// queued: boolean;
// offline: boolean;
// abortKey: string;
// cacheKey: string;
// queueKey: string;
// effectKey: string;
// used: boolean;
// deduplicate: boolean;
// deduplicateTime: number;
// dataMapper?: PayloadMapperType<Payload>;
// mock?: Generator<GeneratorReturnMockTypes<Response, any>, GeneratorReturnMockTypes<Response, any>, GeneratorReturnMockTypes<Response, any>>;
// mockData?: RequestDataMockTypes<Response, any>;
// isMockEnabled: boolean;
