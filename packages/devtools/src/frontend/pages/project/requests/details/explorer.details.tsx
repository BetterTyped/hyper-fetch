import { ComponentType } from "react";
import { SendIcon } from "lucide-react";

import { Back } from "./back/back";
import * as Tabs from "frontend/components/tabs/tabs";
import { Separator } from "frontend/components/separator/separator";
import { Chip } from "frontend/components/chip/chip";
import { Button } from "frontend/components/button/button";
import { ExploreTabs } from "./details.types";
import { TabParams } from "./tab-params/tab-params";
import { Method } from "frontend/components/method/method";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Bar } from "frontend/components/bar/bar";
import { DevtoolsExplorerRequest } from "../list/content.types";

const components: Record<ExploreTabs, ComponentType<{ item: DevtoolsExplorerRequest }>> = {
  [ExploreTabs.PARAMS]: TabParams,
  [ExploreTabs.AUTH]: () => <div>Authorization</div>,
  [ExploreTabs.HEADERS]: () => <div>Headers</div>,
  [ExploreTabs.BODY]: () => <div>Body</div>,
  [ExploreTabs.QUERY]: () => <div>Query</div>,
  [ExploreTabs.RESPONSE]: () => <div>Response</div>,
};

export const ExplorerDetails = () => {
  const {
    state: { detailsExplorerRequest: item },
  } = useDevtools();

  if (!item) return null;

  return (
    <div className="flex flex-col flex-1">
      <Bar className="flex-wrap-none">
        <Back />
        <Separator className="h-[18px] mx-1" />
        <div className="flex flex-1 items-center text-sm gap-2.5">
          <div className="flex flex-1 gap-2.5">
            <div className="flex items-center gap-[3px] bg-light-300 dark:bg-dark-500 border-none rounded-md text-dark-400 dark:text-light-300 text-base px-2.5 py-1 w-full">
              <Chip color="blue">
                <Method method={item.request.method} />
              </Chip>
              <Separator className="h-[18px] mx-1" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full text-sm font-normal">
                <span className="font-medium inline-block text-cyan-800 dark:text-cyan-200 opacity-60">
                  {"{{baseUrl}}"}
                </span>
                {item.request.endpoint}
              </span>
            </div>
            <Button>
              Send
              <SendIcon className="w-3 ml-[1px] -mb-[2px]" />
            </Button>
          </div>
        </div>
      </Bar>
      <div className="overflow-y-auto p-2.5">
        <Tabs.Root defaultValue={ExploreTabs.PARAMS}>
          <Tabs.List>
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
      </div>
    </div>
  );
};
