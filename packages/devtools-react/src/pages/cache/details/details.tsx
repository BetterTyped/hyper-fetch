import { useMemo, useState } from "react";
import { Resizable } from "re-resizable";

import { DevtoolsCacheEvent } from "devtools.types";
import { Back } from "./back/back";
import { Separator } from "components/separator/separator";
import { Button } from "components/button/button";
import { Toolbar } from "components/toolbar/toolbar";
import { JSONViewer } from "components/json-viewer/json-viewer";
import { useDevtoolsContext } from "devtools.context";
import { Collapsible } from "components/collapsible/collapsible";
import { Table } from "components/table/table";
import { RowInfo } from "components/table/row-info/row-info";
import { Countdown } from "components/countdown/countdown";
import { Chip } from "components/chip/chip";

import { styles } from "../cache.styles";

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

export const Details = ({ item }: { item: DevtoolsCacheEvent }) => {
  const css = styles.useStyles();

  const [stale, setStale] = useState(item.cacheData.timestamp + item.cacheData.cacheTime < Date.now());

  const { client } = useDevtoolsContext("DevtoolsCacheDetails");

  const elements = useMemo(() => {
    const { data, error, extra, timestamp, success, status, retries, isCanceled, isOffline, ...additionalData } =
      item.cacheData;

    return { data: { data, error, extra, status, timestamp, success, retries, isCanceled, isOffline }, additionalData };
  }, [item]);

  const onChangeData = (newData: any) => {
    client.cache.storage.set<any, any, any>(item.cacheKey, { ...item.cacheData, ...newData });
    client.cache.lazyStorage?.set<any, any, any>(item.cacheKey, { ...item.cacheData, ...newData });
    client.cache.events.emitCacheData<any, any, any>(item.cacheKey, { ...item.cacheData, ...newData });
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
        <div style={{ ...nameStyle }}>
          {item.cacheKey}
          <Chip color={stale ? "orange" : "green"}>{stale ? "Stale" : "Fresh"}</Chip>
          {item.cacheData.hydrated && <Chip color="green">Hydrated</Chip>}
        </div>
        <div style={{ flex: "1 1 auto" }} />
        <div style={{ ...buttonsStyle }}>
          <Button color="secondary">Invalidate</Button>
          <Button color="error">Remove</Button>
        </div>
      </Toolbar>
      <div className={css.detailsContent}>
        <Collapsible title="General" defaultOpen>
          <div style={{ padding: "10px" }}>
            <Table>
              <tbody>
                <RowInfo
                  label="Last updated:"
                  value={`${new Date(item.cacheData.timestamp).toLocaleDateString()}, ${new Date(item.cacheData.timestamp).toLocaleTimeString()}`}
                />
                <RowInfo
                  label="Time left before stale:"
                  value={
                    <Countdown
                      value={item.cacheData.timestamp + item.cacheData.cacheTime}
                      onDone={() => setStale(true)}
                      onStart={() => setStale(false)}
                      doneText={<Chip color="gray">Cache data is stale</Chip>}
                    />
                  }
                />
                <RowInfo
                  label="Time left for garbage collection:"
                  value={
                    <Countdown
                      value={item.cacheData.timestamp + item.cacheData.garbageCollection}
                      doneText={<Chip color="gray">Data removed from cache</Chip>}
                    />
                  }
                />
              </tbody>
            </Table>
          </div>
        </Collapsible>
        <Collapsible title="Config" defaultOpen>
          <div style={{ padding: "10px" }}>
            <JSONViewer data={elements.additionalData} onChange={onChangeData} sortObjectKeys />
          </div>
        </Collapsible>
        <Collapsible title="Cache" defaultOpen>
          <div style={{ padding: "10px" }}>
            <JSONViewer data={elements.data} onChange={onChangeData} />
          </div>
        </Collapsible>
      </div>
    </Resizable>
  );
};
