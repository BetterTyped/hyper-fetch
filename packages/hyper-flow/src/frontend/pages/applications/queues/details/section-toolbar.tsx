import { useMemo } from "react";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";
import { TrashIcon, XIcon, Sparkles, LoaderIcon, Cpu } from "lucide-react";
import { useQueue } from "@hyper-fetch/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarHeader } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStore } from "@/store/applications/queue.store";

export const SectionToolbar = ({ item }: { item: QueueDataType<RequestInstance> }) => {
  const { client, application } = useDevtools();
  const closeDetails = useQueueStore((state) => state.closeDetails);

  const dummyRequest = useMemo(() => {
    return client.createRequest()({
      endpoint: "",
      queryKey: item?.queryKey,
      method: item?.queryKey.split("_")[0],
    });
  }, [client, item?.queryKey]);

  const { start, stop, stopped, dispatcher } = useQueue(dummyRequest as unknown as RequestInstance);

  const toggleQueue = () => {
    if (stopped) {
      start();
    } else {
      stop();
    }
  };

  const clear = () => {
    if (item) {
      dispatcher.cancelRunningRequests(item.queryKey);
      dispatcher.clearQueue(item.queryKey);
    }
  };

  return (
    <SidebarHeader className="flex flex-row items-center h-12 mt-1 border-b border-sidebar-border gap-3">
      <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2" onClick={() => closeDetails(application.name)}>
        <XIcon className="h-4 w-4 stroke-muted-foreground" />
      </Button>
      <div className="flex flex-row items-center gap-1 text-sm font-light text-muted-foreground flex-1">
        <span className="flex flex-row items-center gap-1 font-medium">
          <Cpu className="w-4 h-4" /> Queue
        </span>{" "}
        / Details
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="quaternary" size="sm">
            <Sparkles className="h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuLabel className="flex flex-row items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Queue Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleQueue}>
            <LoaderIcon className="mr-2 h-4 w-4" />
            {stopped ? "Start" : "Stop"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={clear}>
            <TrashIcon className="mr-2 h-4 w-4" />
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarHeader>
  );
};
