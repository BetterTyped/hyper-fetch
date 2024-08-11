import { useMemo } from "react";
import { Resizable } from "re-resizable";

import { DevtoolsQueueItemData } from "devtools.types";
import { Back } from "./back/back";
import { Separator } from "components/separator/separator";
import { Button } from "components/button/button";
import { Toolbar } from "components/toolbar/toolbar";
import { JSONViewer } from "components/json-viewer/json-viewer";
import { useDevtoolsContext } from "devtools.context";
import { Collapsible } from "components/collapsible/collapsible";
import { Table } from "components/table/table";
import { RowInfo } from "components/table/row-info/row-info";
import { getQueueStatus } from "utils/queue.status.utils";
import { Chip } from "components/chip/chip";

import { styles } from "../processing.styles";

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

export const Details = ({ item }: { item: DevtoolsQueueItemData }) => {
  const css = styles.useStyles();

  const { client } = useDevtoolsContext("DevtoolsCacheDetails");

  // TODO: Create use queue hook
  const { queue, status, color } = useMemo(() => {
    const queueElement = client[item.type].getQueue(item.queueKey);
    const statusValue = getQueueStatus(queueElement);

    const statusColor = (
      {
        Pending: "gray",
        Running: "blue",
        Stopped: "orange",
      } as const
    )[statusValue];

    return {
      queue: queueElement,
      status: statusValue,
      color: statusColor,
    };
  }, [client, item.queueKey, item.type]);

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
        <div style={{ ...nameStyle }}>
          {queue.queueKey}
          <Chip color={color}>{status}</Chip>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        <div style={{ ...buttonsStyle }}>
          <Button color="secondary">Stop</Button>
          <Button color="error">Clear</Button>
        </div>
      </Toolbar>
      <div className={css.detailsContent}>
        <Collapsible title="General" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo label="Last updated:" value="12:22:56 GMT+0200" />
                <RowInfo label="Requests processed:" value="23" />
                <RowInfo label="Requests active:" value="12" />
              </tbody>
            </Table>
          </div>
        </Collapsible>
        <Collapsible title="Queue" defaultOpen>
          <div style={{ padding: "10px" }}>
            <JSONViewer data={{ test: 1 }} />
          </div>
        </Collapsible>
      </div>
    </Resizable>
  );
};
