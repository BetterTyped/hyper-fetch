import { ComponentType } from "react";
import { SendIcon } from "lucide-react";

import { Back } from "./back/back";
import * as Tabs from "components/tabs/tabs";
import { Separator } from "components/separator/separator";
import { Chip } from "components/chip/chip";
import { Button } from "components/button/button";
import { ExploreTabs } from "./details.types";
import { TabParams } from "./tab-params/tab-params";
import { Method } from "components/method/method";
import { DevtoolsExplorerRequest } from "../sidebar/content.types";
import { useDevtoolsContext } from "devtools.context";
import { createStyles } from "theme/use-styles.hook";
import { Bar } from "components/bar/bar";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    base: css`
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
    `,
    row: css`
      display: flex;
      flex: 1 1 auto;
      gap: 10px;
    `,
    item: css`
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    details: css`
      position: absolute !important;
      display: flex;
      flex-direction: column;
      top: 0px;
      right: 0px;
      bottom: 0px;
      background: ${isLight ? tokens.colors.light[100] : tokens.colors.dark[700]};
      border-left: 1px solid ${isLight ? tokens.colors.light[400] : tokens.colors.dark[400]};
    `,
    content: css`
      overflow-y: auto;
      padding: 10px 10px;
    `,
    block: css`
      padding: 10px;
    `,
    head: css`
      display: flex;
      align-items: center;
      flex: 1 1 auto;
      font-size: 14px;
      gap: 10px;
    `,
    bar: css`
      display: flex;
      align-items: center;
      gap: 3px;
      background: ${isLight ? tokens.colors.light[300] : tokens.colors.dark[500]};
      border: none;
      border-radius: 6px;
      color: ${isLight ? tokens.colors.dark[400] : tokens.colors.light[300]};
      font-size: 16px;
      padding: 4px 10px 4px 4px;
      width: 100%;
    `,
    endpoint: css`
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      font-size: 14px;
      font-weight: 400;

      & span {
        font-weight: 500;
        display: inline-block;
        color: ${isLight ? tokens.colors.cyan[800] : tokens.colors.cyan[200]};
        opacity: 0.6;
      }
    `,
    tabs: css``,
  };
});

const components: Record<ExploreTabs, ComponentType<{ item: DevtoolsExplorerRequest }>> = {
  [ExploreTabs.PARAMS]: TabParams,
  [ExploreTabs.AUTH]: () => <div>Authorization</div>,
  [ExploreTabs.HEADERS]: () => <div>Headers</div>,
  [ExploreTabs.BODY]: () => <div>Body</div>,
  [ExploreTabs.QUERY]: () => <div>Query</div>,
  [ExploreTabs.RESPONSE]: () => <div>Response</div>,
};

export const ExplorerDetails = () => {
  const { detailsExplorerRequest: item } = useDevtoolsContext("DevtoolsExplorerDetails");

  const css = styles.useStyles();

  if (!item) return null;

  return (
    <div className={css.base}>
      <Bar style={{ flexWrap: "nowrap" }}>
        <Back />
        <Separator style={{ height: "18px", margin: "0 4px 0 0" }} />
        <div className={css.head}>
          <div className={css.row}>
            <div className={css.bar}>
              <Chip color="blue">
                <Method method={item.request.method} />
              </Chip>
              <Separator style={{ height: "18px", margin: "0 4px" }} />
              <span className={css.endpoint}>
                <span>{"{{baseUrl}}"}</span>
                {item.request.endpoint}
              </span>
            </div>
            <Button>
              Send
              <SendIcon
                style={{
                  width: "12px",
                  marginLeft: "1px",
                  marginBottom: "-2px",
                }}
              />
            </Button>
          </div>
        </div>
      </Bar>
      <div className={css.content}>
        {/* Tabs */}
        <Tabs.Root defaultValue={ExploreTabs.PARAMS}>
          <Tabs.List className={css.tabs}>
            {Object.values(ExploreTabs).map((tab) => {
              return (
                <Tabs.Trigger key={tab} value={tab}>
                  {tab}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
          {Object.entries(components).map(([tab, Component]) => {
            return (
              <Tabs.Content key={tab} value={tab}>
                <Component item={item} />
              </Tabs.Content>
            );
          })}
        </Tabs.Root>
        {/* Content */}
      </div>
    </div>
  );
};
