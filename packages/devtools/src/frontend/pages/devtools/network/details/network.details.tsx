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
import { useDevtoolsContext } from "frontend/pages/devtools/devtools.context";
import { createStyles } from "frontend/theme/use-styles.hook";
import { Sidebar } from "frontend/components/sidebar/sidebar";

const styles = createStyles(({ css }) => {
  return {
    details: css`
      position: absolute !important;
      display: flex;
      flex-direction: column;
      top: 0;
      right: 0;
      bottom: 0;
    `,
    buttons: css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      margin-top: 5px;
    `,
    block: css`
      padding: 10px;
    `,
    spacer: css`
      flex: 1 1 auto;
    `,
    name: css`
      display: flex;
      align-items: center;
      gap: 4px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      & svg {
        transform: translateY(1px);
      }
    `,
    content: css`
      overflow-y: auto;
      padding-bottom: 10px;
    `,
  };
});

export const NetworkDetails = () => {
  const css = styles.useStyles();

  const { removeNetworkRequest, theme, requests, detailsRequestId } = useDevtoolsContext("DevtoolsNetworkDetails");

  const item = useMemo(() => {
    if (!detailsRequestId) return null;
    return requests.find((request) => request.requestId === detailsRequestId);
  }, [detailsRequestId, requests]);

  const config = useMemo(() => {
    if (!item) return null;

    const values = item.request.toJSON();
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
    return getStatusColor(status, theme === "light");
  }, [status, theme]);

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
      className={css.details}
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
        <div className={css.name} style={{ color }}>
          <RequestStatusIcon status={status} />
          {item.request.endpoint}
        </div>
        <div className={css.spacer} />
      </Bar>
      <div className={css.content}>
        <div className={css.block}>
          <Table.Root>
            <Table.Body>
              <RowInfo
                label="Request URL:"
                value={
                  <Chip color="normal">
                    {item.request.client.url}
                    {item.request.endpoint}
                  </Chip>
                }
              />
              <RowInfo label="Request Method:" value={<Chip color="blue">{String(item.request.method)}</Chip>} />
              <RowInfo
                label="Status Code:"
                value={<Chip color={item.isSuccess ? "green" : "red"}>{String(item.response?.status ?? "")}</Chip>}
              />
              <RowInfo label="Request ID:" value={<Chip color="gray">{String(item.requestId)}</Chip>} />
            </Table.Body>
          </Table.Root>
          {!!item.details?.retries && <Chip>Retried Request ({item.details.retries})</Chip>}
          {item.request.isMockerEnabled && !!(item.request.mock || item.request.mockData) && (
            <Chip color="orange">Mocked</Chip>
          )}
          <div className={css.buttons}>
            <Button color="gray" onClick={remove}>
              <TrashIcon />
              Remove
            </Button>
          </div>
        </div>
        <Collapsible title="Request">
          <div className={css.block}>
            <JSONViewer data={config} sortObjectKeys />
          </div>
        </Collapsible>
        <Collapsible title="Payload">
          <div className={css.block}>
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
          <div className={css.block}>
            <JSONViewer data={item.response} />
          </div>
        </Collapsible>
        <Collapsible title="Processing Details" defaultOpen>
          <div className={css.block}>
            <JSONViewer data={item.details} />
          </div>
        </Collapsible>
      </div>
    </Sidebar>
  );
};
