import { useMemo } from "react";
import { QueueDataType, RequestInstance } from "@hyper-fetch/core";
import { TrashIcon, XIcon, Sparkles, Cpu, LoaderCircle, Pause } from "lucide-react";
import { useQueue } from "@hyper-fetch/react";
import { useShallow } from "zustand/react/shallow";

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
import { useNetworkStore } from "@/store/applications/network.store";

export const SectionToolbar = ({ item }: { item: QueueDataType<RequestInstance> }) => {
  const { client, application } = useDevtools();
  const { closeDetails, loadingKeys, addLoadingKey, removeLoadingKey } = useQueueStore(
    useShallow((state) => {
      return {
        loadingKeys: state.applications[application.name].loadingKeys,
        addLoadingKey: state.addLoadingKey,
        removeLoadingKey: state.removeLoadingKey,
        closeDetails: state.closeDetails,
      };
    }),
  );
  const requests = useNetworkStore((state) => state.applications[application.name].requests);

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
      dispatcher.events.emitQueueStatusChanged({ ...item, stopped: false }, true);
    } else {
      stop();
      dispatcher.events.emitQueueStatusChanged({ ...item, stopped: true }, true);
    }
  };

  const clear = () => {
    if (item) {
      dispatcher.clearQueue(item.queryKey);
      dispatcher.events.emitDrained(item, true);
    }
  };

  const latestItem = useMemo(() => {
    if (!item) return null;

    const element = requests.find((el) => el.request.queryKey === item.queryKey);
    if (!element)
      return {
        request: {
          cacheKey: item.queryKey,
        } as any,
        requestId: "",
      };
    return element;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.queryKey, requests?.length]);

  const isLoading = item ? loadingKeys.has(latestItem?.request.queryKey || item.queryKey) : false;

  const toggleLoading = () => {
    if (!item || !latestItem) return;

    // This is dummy data for the event, it is minimum that is required to trigger the event
    // We don't need to pass all the data, because it will be handled anyway
    const eventData = {
      request: latestItem.request,
      isRetry: false,
      isOffline: false,
      requestId: "",
    };

    if (!isLoading) {
      client.requestManager.events.emitLoading({ ...eventData, loading: true }, true);
      addLoadingKey({ application: application.name, queryKey: item.queryKey });
    } else {
      client.requestManager.events.emitLoading({ ...eventData, loading: false }, true);
      removeLoadingKey({ application: application.name, queryKey: item.queryKey });
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

          <DropdownMenuItem onClick={toggleLoading} disabled={!latestItem}>
            <LoaderCircle className="mr-2 h-4 w-4" />
            {isLoading ? "Restore" : "Set"} loading
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleQueue}>
            <Pause className="mr-2 h-4 w-4" />
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
