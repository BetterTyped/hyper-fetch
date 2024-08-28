import { ComponentType, useState } from "react";
import { Resizable } from "re-resizable";
import { RequestInstance } from "@hyper-fetch/core";

import { Back } from "./back/back";
import { Separator } from "components/separator/separator";
import { Toolbar } from "components/toolbar/toolbar";
import { Chip } from "components/chip/chip";
import { Button } from "components/button/button";
import { SendIcon } from "icons/send";
import { Tabs } from "./details.types";
import { TabParams } from "./tab-params/tab-params";

import { styles } from "../explorer.styles";

const components: Record<Tabs, ComponentType<{ item: RequestInstance }>> = {
  [Tabs.PARAMS]: TabParams,
  [Tabs.AUTH]: () => <div>Authorization</div>,
  [Tabs.HEADERS]: () => <div>Headers</div>,
  [Tabs.BODY]: () => <div>Body</div>,
  [Tabs.QUERY]: () => <div>Query</div>,
  [Tabs.RESPONSE]: () => <div>Response</div>,
};

export const Details = ({ item }: { item: RequestInstance }) => {
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
      <Toolbar style={{ borderBottom: "0px", flexWrap: "nowrap" }}>
        <Back />
        <Separator style={{ height: "18px", margin: "0 4px 0 0" }} />
        <div className={css.head}>
          <div className={css.bar}>
            <Chip color="blue">{String(item.method)}</Chip>
            <Separator style={{ height: "18px", margin: "0 4px" }} />
            <span className={css.endpoint}>{item.endpoint}</span>
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
      </Toolbar>
      <div className={css.detailsContent}>
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
