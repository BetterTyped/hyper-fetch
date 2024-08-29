import { ComponentType, useState } from "react";
import { Resizable } from "re-resizable";

import { Back } from "./back/back";
import { Separator } from "components/separator/separator";
import { Toolbar } from "components/toolbar/toolbar";
import { Chip } from "components/chip/chip";
import { Button } from "components/button/button";
import { SendIcon } from "icons/send";
import { Tabs } from "./details.types";
import { TabParams } from "./tab-params/tab-params";
import { DevtoolsExplorerRequest } from "../content/content.types";
import { Method } from "components/method/method";

import { styles } from "../explorer.styles";

const components: Record<Tabs, ComponentType<{ item: DevtoolsExplorerRequest }>> = {
  [Tabs.PARAMS]: TabParams,
  [Tabs.AUTH]: () => <div>Authorization</div>,
  [Tabs.HEADERS]: () => <div>Headers</div>,
  [Tabs.BODY]: () => <div>Body</div>,
  [Tabs.QUERY]: () => <div>Query</div>,
  [Tabs.RESPONSE]: () => <div>Response</div>,
};

export const Details = ({ item }: { item: DevtoolsExplorerRequest }) => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.PARAMS);

  const css = styles.useStyles();

  const TabContent = components[activeTab];

  return (
    <Resizable
      bounds="parent"
      defaultSize={{ width: "80%", height: "100%" }}
      maxWidth="90%"
      minWidth="200px"
      boundsByDirection
      className={css.details}
    >
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
    </Resizable>
  );
};
