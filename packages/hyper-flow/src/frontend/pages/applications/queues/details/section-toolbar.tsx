import type { QueueDataType, RequestInstance } from "@hyper-fetch/core";
import { useQueue } from "@hyper-fetch/react";
import { TrashIcon, XIcon, Sparkles, Cpu, LoaderCircle, Pause } from "lucide-react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarHeader } from "@/components/ui/sidebar";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useNetworkStore } from "@/store/applications/network.store";
import { useQueueStore } from "@/store/applications/queue.store";

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

  // The method decides which dispatcher owns the queue. A custom query key says nothing about it, so it comes from a
  // request of this queue, and the default "<method>_<endpoint>_<query>" key is only the last resort
  const method = useMemo(() => {
    const sent = requests.find((el) => el.request.queryKey === item.queryKey);
    return sent?.request.method ?? item.requests[0]?.request.method ?? item.queryKey.split("_")[0];
  }, [requests, item.queryKey, item.requests]);

  const dummyRequest = useMemo(() => {
    return client.createRequest()({
      endpoint: "",
      queryKey: item.queryKey,
      method,
    });
  }, [client, item.queryKey, method]);

  const { start, stop, dispatcher } = useQueue(dummyRequest as unknown as RequestInstance);
  // The user's application owns the queue, HyperFlow's own dispatcher only learns about changes made after it mounted
  const { stopped } = item;

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
    dispatcher.clearQueue(item.queryKey);
    dispatcher.events.emitDrained(item, true);
  };

  const isLoading = loadingKeys.has(item.queryKey);

  const toggleLoading = () => {
    // The loading event only needs the keys the user's hooks listen on, so a queue whose requests left the network
    // list still reaches them through its query key
    const sent = requests.find((el) => el.request.queryKey === item.queryKey);
    const eventData = {
      request: (sent?.request ?? { queryKey: item.queryKey }) as unknown as RequestInstance,
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

          <DropdownMenuItem onClick={toggleLoading}>
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
