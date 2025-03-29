import { ComponentType } from "react";
import { SendIcon } from "lucide-react";

import { Back } from "./back/back";
import { Button } from "frontend/components/ui/button";
import { Separator } from "frontend/components/ui/separator";
import { Chip } from "frontend/components/ui/chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "frontend/components/ui/tabs";
import { ExploreTabs } from "./details.types";
import { TabParams } from "./tab-params/tab-params";
import { Method } from "frontend/components/ui/method";
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
        <Separator orientation="vertical" className="h-[18px] mx-1" />
        <div className="flex flex-1 items-center text-sm gap-2.5">
          <div className="flex flex-1 gap-2.5">
            <div className="flex items-center gap-[3px] bg-muted border-none rounded-md text-muted-foreground text-base px-2.5 py-1 w-full">
              <Chip color="blue">
                <Method method={item.request.method} />
              </Chip>
              <Separator orientation="vertical" className="h-[18px] mx-1" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full text-sm font-normal">
                <span className="font-medium inline-block text-cyan-800 dark:text-cyan-200 opacity-60">
                  {"{{baseUrl}}"}
                </span>
                {item.request.endpoint}
              </span>
            </div>
            <Button size="default" variant="default">
              Send
              <SendIcon className="w-3 ml-[1px] -mb-[2px]" />
            </Button>
          </div>
        </div>
      </Bar>
      <div className="overflow-y-auto p-2.5">
        <Tabs defaultValue={ExploreTabs.PARAMS}>
          <TabsList>
            {Object.values(ExploreTabs).map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(components).map(([tab, Component]) => (
            <TabsContent key={tab} value={tab}>
              <Component item={item} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
