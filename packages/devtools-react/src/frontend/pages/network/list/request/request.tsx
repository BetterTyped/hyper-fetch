import { useMemo } from "react";

import * as Table from "frontend/components/table/table";
import { DevtoolsRequestEvent } from "frontend/devtools.types";
import { getStatus, getStatusColor, RequestStatusIcon } from "frontend/utils/request.status.utils";
import { useDevtoolsContext } from "frontend/devtools.context";
import { createStyles } from "frontend/theme/use-styles.hook";

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

export const Request = ({ item }: { item: DevtoolsRequestEvent }) => {
  const { setDetailsRequestId, theme, detailsRequestId } = useDevtoolsContext("DevtoolsNetworkRequest");
  const css = styles.useStyles();

  const status = useMemo(() => {
    return getStatus(item);
  }, [item]);

  const color = useMemo(() => {
    return getStatusColor(status, theme === "light");
  }, [status, theme]);

  return (
    <Table.Row
      tabIndex={0}
      role="button"
      onClick={() => setDetailsRequestId(item.requestId)}
      className={css.clsx(css.row, { [css.activeRow]: item.requestId === detailsRequestId })}
    >
      <Table.Cell className={css.cell} style={{ color }}>
        <div className={css.endpointCell}>
          <RequestStatusIcon status={status} />
          <span>{item.request.endpoint}</span>
        </div>
      </Table.Cell>

      <Table.Cell className={css.cell} style={{ color }}>
        {String(item.request.method)}
      </Table.Cell>
      <Table.Cell className={css.cell} style={{ color, textTransform: "capitalize" }}>
        {String(item.response?.success ?? "")}
      </Table.Cell>
      <Table.Cell className={css.cell} style={{ color }}>
        <div>
          {new Date(item.triggerTimestamp).toLocaleTimeString()}{" "}
          {!!item.details?.responseTimestamp && (
            <span className={css.timestamp}>({item.details.responseTimestamp - item.triggerTimestamp}ms)</span>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};
