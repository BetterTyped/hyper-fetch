import { useEffect, useMemo, useState } from "react";
import { TrashIcon, FileXIcon, TriangleAlert, LoaderIcon } from "lucide-react";
import { AdapterInstance, CacheValueType, getLoadingByCacheKey } from "@hyper-fetch/core";

import { Back } from "./back/back";
import { Separator } from "frontend/components/separator/separator";
import { Button } from "frontend/components/button/button";
import { Bar } from "frontend/components/bar/bar";
import { JSONViewer } from "frontend/components/json-viewer/json-viewer";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";
import { Collapsible } from "frontend/components/collapsible/collapsible";
import * as Table from "frontend/components/table/table";
import { RowInfo } from "frontend/components/table/row-info/row-info";
import { Countdown } from "frontend/components/countdown/countdown";
import { Chip } from "frontend/components/chip/chip";
import { Key } from "frontend/components/key/key";
import { Sidebar } from "frontend/components/sidebar/sidebar";
import { createStyles } from "frontend/theme/use-styles.hook";

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
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    content: css`
      overflow-y: auto;
      padding-bottom: 10px;
    `,
  };
});

export const CacheDetails = () => {
  const css = styles.useStyles();
  const { client, requests, inProgress, loadingKeys, setLoadingKeys, simulatedError, detailsCacheKey, cache } =
    useDevtoolsContext("DevtoolsCacheDetails");

  const item = useMemo(() => {
    if (!detailsCacheKey) return null;
    return cache.find((request) => request.cacheKey === detailsCacheKey);
  }, [detailsCacheKey, cache]);

  const [listeners, setListeners] = useState(
    item ? client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length : 0,
  );

  const [stale, setStale] = useState(
    item ? item.cacheData.responseTimestamp + item.cacheData.staleTime < Date.now() : false,
  );

  const hasInProgressRequest = item ? inProgress.some((i) => i.cacheKey === item.cacheKey) : false;
  const isLoading = item ? loadingKeys.includes(item.cacheKey) : false;

  const elements = useMemo(() => {
    if (!item) return null;

    const {
      data,
      error,
      extra,
      responseTimestamp,
      requestTimestamp,
      success,
      status,
      retries,
      isCanceled,
      isOffline,
      ...additionalData
    } = item.cacheData;

    return {
      data: {
        data,
        error,
        extra,
        status,
        responseTimestamp,
        requestTimestamp,
        success,
        retries,
        isCanceled,
        isOffline,
      },
      additionalData,
    } satisfies {
      data: Partial<CacheValueType<any, any, AdapterInstance>>;
      additionalData: Partial<CacheValueType<any, any, AdapterInstance>>;
    };
  }, [item]);

  const latestItem = useMemo(() => {
    if (!item) return null;

    const element = requests.find((el) => el.request.cacheKey === item.cacheKey);
    if (!element)
      return {
        request: {
          cacheKey: item.cacheKey,
        } as any,
        requestId: "",
      };
    return element;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.cacheKey, requests?.length]);

  const onChangeData = (newData: CacheValueType<any, any, any>) => {
    if (item) {
      const data = { ...item.cacheData, ...newData, version: client.cache.version };

      client.cache.storage.set<any, any, any>(item.cacheKey, data);
      client.cache.lazyStorage?.set<any, any, any>(item.cacheKey, data);
      client.cache.events.emitCacheData<any, any, any>(data);
    }
  };

  const invalidate = () => {
    if (!item) return;
    client.cache.invalidate(item.cacheKey);
  };

  const remove = () => {
    if (!item) return;
    client.cache.delete(item.cacheKey);
  };

  const toggleLoading = () => {
    if (!item || !latestItem) return;
    if (!hasInProgressRequest) {
      setLoadingKeys((prev) => {
        if (prev.includes(item.cacheKey)) {
          client.requestManager.events.emitLoading({
            loading: false,
            isOffline: false,
            isRetry: false,
            request: latestItem?.request,
            requestId: latestItem.requestId,
          });
          return prev.filter((i) => i !== item.cacheKey);
        }
        client.requestManager.events.emitLoading({
          loading: true,
          isOffline: false,
          isRetry: false,
          request: latestItem.request,
          requestId: latestItem.requestId,
        });
        return [...prev, item.cacheKey];
      });
    }
  };

  const error = () => {
    if (!item) return;
    const data: CacheValueType<unknown, unknown, any> = {
      ...item.cacheData,
      data: null,
      error: simulatedError,
      responseTimestamp: Date.now(),
      extra: client.defaultExtra,
      success: false,
    };
    client.cache.storage.set(item.cacheKey, data);
    client.cache.events.emitCacheData(data);
  };

  useEffect(() => {
    return item
      ? client.requestManager.emitter.onListener(getLoadingByCacheKey(item?.cacheKey), (count) => {
          setListeners(count);
        })
      : undefined;
  }, [client.requestManager.emitter, item, item?.cacheKey]);

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
        <Key value={item.cacheKey} type="cache" />
        <Chip color={stale ? "orange" : "green"}>{stale ? "Stale" : "Fresh"}</Chip>
        {item.cacheData.hydrated && <Chip color="green">Hydrated</Chip>}
        <div style={{ flex: "1 1 auto" }} />
      </Bar>
      <div className={css.content}>
        <div style={{ padding: "10px" }}>
          <Table.Root>
            <Table.Body>
              <RowInfo label="Cache Observers:" value={listeners} />
              <RowInfo
                label="Last updated:"
                value={`${new Date(item.cacheData.responseTimestamp).toLocaleDateString()}, ${new Date(item.cacheData.responseTimestamp).toLocaleTimeString()}`}
              />
              <RowInfo
                label="Time left before stale:"
                value={
                  <Countdown
                    value={item.cacheData.responseTimestamp + item.cacheData.staleTime}
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
                    value={item.cacheData.responseTimestamp + item.cacheData.cacheTime}
                    doneText={<Chip color="gray">Data removed from cache</Chip>}
                  />
                }
              />
            </Table.Body>
          </Table.Root>

          <div className={css.buttons}>
            <Button color={isLoading ? "teal" : "blue"} onClick={toggleLoading} disabled={hasInProgressRequest}>
              <LoaderIcon />
              {isLoading ? "Restore" : "Set"} loading
            </Button>
            <Button color="red" onClick={error}>
              <TriangleAlert />
              Simulate Error
            </Button>
            <Button color="pink" onClick={invalidate}>
              <FileXIcon />
              Invalidate
            </Button>
            <Button color="gray" onClick={remove}>
              <TrashIcon />
              Remove
            </Button>
          </div>
        </div>
        <Collapsible title="Config" defaultOpen>
          <div style={{ padding: "10px" }}>
            <JSONViewer data={elements?.additionalData} onChange={onChangeData} sortObjectKeys />
          </div>
        </Collapsible>
        <Collapsible title="Cache" defaultOpen>
          <div style={{ padding: "10px" }}>
            <JSONViewer data={elements?.data} onChange={onChangeData} />
          </div>
        </Collapsible>
      </div>
    </Sidebar>
  );
};
