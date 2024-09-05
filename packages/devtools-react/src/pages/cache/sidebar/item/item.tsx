import { useEffect, useState } from "react";
import { getLoadingByCacheKey } from "@hyper-fetch/core";

import * as Table from "components/table/table";
import { DevtoolsCacheEvent } from "devtools.types";
import { useDevtoolsContext } from "devtools.context";
import { useCountdown } from "hooks/use-countdown";
import { Chip } from "components/chip/chip";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    row: css`
      cursor: pointer;
      &:hover {
        background: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[500]}!important;
      }
    `,
    activeRow: css`
      box-shadow: inset 0px 0px 2px 1px ${isLight ? tokens.colors.blue[400] : tokens.colors.blue[400]}!important;
    `,
    cell: css`
      font-weight: 300;
      font-size: 14px;
      padding: 4px 8px;
      &:first-child {
        padding-left: 10px;
      }
      &:last-child {
        padding-right: 10px;
      }
    `,
    endpointCell: css`
      display: flex;
      align-items: center;
      gap: 4px;

      & svg {
        min-width: 14px;
      }
    `,
    timestamp: css`
      color: ${isLight ? tokens.colors.light[700] : tokens.colors.light[700]};
    `,
  };
});

export const Item = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { client, setDetailsCacheKey, detailsCacheKey } = useDevtoolsContext("DevtoolsCacheItem");
  const css = styles.useStyles();

  const cacheTimestamp = item.cacheData.responseTimestamp + item.cacheData.cacheTime;
  const countdown = useCountdown(cacheTimestamp);

  const [listeners, setListeners] = useState(
    client.requestManager.emitter.listeners(getLoadingByCacheKey(item.cacheKey))?.length,
  );

  useEffect(() => {
    return client.requestManager.emitter.onListenChange(getLoadingByCacheKey(item.cacheKey), (count) => {
      setListeners(count);
    });
  }, [client.requestManager.emitter, item.cacheKey, setDetailsCacheKey]);

  const isFresh = cacheTimestamp >= Date.now() ? Object.values(countdown).some((v) => v > 1) : false;

  return (
    <Table.Row
      tabIndex={0}
      role="button"
      onClick={() => setDetailsCacheKey(item.cacheKey)}
      className={css.clsx(css.row, { [css.activeRow]: item.cacheKey === detailsCacheKey })}
    >
      <Table.Cell className={css.cell}>
        <span>{item.cacheKey}</span>
      </Table.Cell>
      <Table.Cell className={css.cell}>
        <Chip color={isFresh ? "green" : "orange"}>{isFresh ? "Fresh" : "Stale"}</Chip>
      </Table.Cell>
      <Table.Cell className={css.cell}>{listeners}</Table.Cell>
      <Table.Cell className={css.cell}>
        {!!item.cacheData?.responseTimestamp && (
          <div>{new Date(item.cacheData.responseTimestamp).toLocaleTimeString()} </div>
        )}
      </Table.Cell>
    </Table.Row>
  );
};
