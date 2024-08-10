import { useMemo } from "react";
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
        <div style={{ ...nameStyle }}>{item.cacheKey}</div>
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
                <RowInfo label="Last updated:" value="12:22:56 GMT+0200" />
                <RowInfo label="Hydrated:" value="false" />
                <RowInfo label="Time left before stale:" value="20min" />
                <RowInfo label="Time left for garbage collection:" value="20min" />
              </tbody>
            </Table>
            {/* // TODO: Info about hydration - "is hydrated"?
                // How much time left to garbage collect?
                // How much time left for cache? */}
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
