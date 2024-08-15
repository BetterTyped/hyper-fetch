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
import { JSONViewer } from "components/json-viewer/json-viewer";
import { RemoveIcon } from "icons/remove";
import { useDevtoolsContext } from "devtools.context";

import { styles } from "../network.styles";

const nameStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

export const Details = ({ item }: { item: DevtoolsRequestEvent }) => {
  const css = styles.useStyles();

  const { removeNetworkRequest } = useDevtoolsContext("DevtoolsNetworkDetails");

  const config = useMemo(() => {
    const values = item.request.toJSON();
    delete values.data;
    delete values.params;
    delete values.queryParams;
    delete values.headers;
    return values;
  }, [item.request]);

  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  const color = useMemo(() => {
    return getStatusColor(status);
  }, [status]);

  const remove = () => {
    removeNetworkRequest(item.requestId);
  };

  return (
    <Resizable
      bounds="parent"
      defaultSize={{ width: "60%", height: "100%" }}
      maxWidth="90%"
      minWidth="200px"
      boundsByDirection
      className={css.details}
    >
      <Toolbar>
        <Back />
        <Separator style={{ height: "18px", margin: "0 12px" }} />
        <div style={{ ...nameStyle, color }}>
          <RequestStatusIcon status={status} />
          {item.request.endpoint}
        </div>
        <div className={css.spacer} />

        <Button color="gray" onClick={remove}>
          <RemoveIcon />
          Remove
        </Button>
      </Toolbar>
      <div className={css.detailsContent}>
        <Collapsible title="General" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo
                  label="Request URL:"
                  value={
                    <Chip color="blue">
                      {item.request.client.url}
                      {item.request.endpoint}
                    </Chip>
                  }
                />
                <RowInfo label="Request Method:" value={<Chip color="gray">{String(item.request.method)}</Chip>} />
                <RowInfo
                  label="Status Code:"
                  value={
                    <Chip color={item.isSuccess ? "green" : "red"}>
                      {item.response?.status ? String(item.response.status) : status}
                    </Chip>
                  }
                />
                <RowInfo label="Request ID:" value={<Chip color="gray">{String(item.requestId)}</Chip>} />
              </tbody>
            </Table>
            {!!item.details?.retries && <Chip>Retried Request ({item.details.retries})</Chip>}
            {item.request.isMockEnabled && !!(item.request.mock || item.request.mockData) && (
              <Chip color="orange">Mocked</Chip>
            )}
          </div>
        </Collapsible>
        <Collapsible title="Request">
          <div style={{ padding: "10px" }}>
            <JSONViewer data={config} sortObjectKeys />
          </div>
        </Collapsible>
        <Collapsible title="Payload">
          <div style={{ padding: "10px" }}>
            <JSONViewer
              data={{
                params: item.request.params,
                queryParams: item.request.queryParams,
                headers: item.request.headers,
                payload: item.request.data,
              }}
            />
          </div>
        </Collapsible>
        <Collapsible title="Response" defaultOpen>
          <div style={{ padding: "10px" }}>
            <JSONViewer data={item.response} />
          </div>
        </Collapsible>
        <Collapsible title="Response Details" defaultOpen>
          <div style={{ padding: "10px" }}>
            <JSONViewer data={item.details} />
          </div>
        </Collapsible>
      </div>
    </Resizable>
  );
};
