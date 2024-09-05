import { ComponentType, useState } from "react";
import { SendIcon } from "lucide-react";

import { Back } from "./back/back";
import { Separator } from "components/separator/separator";
import { Toolbar } from "components/toolbar/toolbar";
import { Chip } from "components/chip/chip";
import { Button } from "components/button/button";
import { Tabs } from "./details.types";
import { TabParams } from "./tab-params/tab-params";
import { Method } from "components/method/method";
import { DevtoolsExplorerRequest } from "../sidebar/content.types";
import { useDevtoolsContext } from "devtools.context";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    row: css`
      display: flex;
      gap: 10px;
      padding: 10px 8px;
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
    detailsContent: css`
      overflow-y: auto;
      padding-bottom: 10px;
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
    tabs: css`
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      gap: 10px;
      padding: 10px;
    `,
  };
});

const components: Record<Tabs, ComponentType<{ item: DevtoolsExplorerRequest }>> = {
  [Tabs.PARAMS]: TabParams,
  [Tabs.AUTH]: () => <div>Authorization</div>,
  [Tabs.HEADERS]: () => <div>Headers</div>,
  [Tabs.BODY]: () => <div>Body</div>,
  [Tabs.QUERY]: () => <div>Query</div>,
  [Tabs.RESPONSE]: () => <div>Response</div>,
};

export const ExplorerDetails = () => {
  const { detailsExplorerRequest: item } = useDevtoolsContext("DevtoolsExplorerDetails");
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.PARAMS);

  const css = styles.useStyles();

  const TabContent = components[activeTab];

  if (!item) return null;

  return (
    <div>
      <Toolbar style={{ flexWrap: "nowrap" }}>
        <Back />
        <Separator style={{ height: "18px", margin: "0 4px 0 0" }} />
        <div className={css.head}>
          <Method method={item.request.method} style={{ marginBottom: "-2px" }} />
          {item.name}
        </div>
      </Toolbar>
      <div className={css.detailsContent}>
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
        {/* Tabs */}
        <div className={css.tabs}>
          {Object.values(Tabs).map((tab) => {
            return (
              <Button key={tab} color={activeTab === tab ? "pink" : "gray"} onClick={() => setActiveTab(tab)}>
                {tab}
              </Button>
            );
          })}
        </div>
        {/* Content */}
        <TabContent item={item} />
      </div>
    </div>
  );
};
