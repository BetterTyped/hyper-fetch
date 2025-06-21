import { Sparkles, Trash, XIcon, Globe } from "lucide-react";

import { SidebarHeader } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DevtoolsRequestEvent } from "@/context/applications/types";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useNetworkStore } from "@/store/applications/network.store";

export const SectionToolbar = ({ item }: { item: DevtoolsRequestEvent }) => {
  const { application } = useDevtools();
  const removeNetworkRequest = useNetworkStore((state) => state.removeNetworkRequest);
  const closeDetails = useNetworkStore((state) => state.closeDetails);

  const close = () => {
    closeDetails(application.name);
  };

  const remove = () => {
    removeNetworkRequest({ application: application.name, requestId: item.requestId ?? "" });
  };

  return (
    <SidebarHeader className="flex flex-row items-center h-12 mt-1 border-b border-sidebar-border gap-3">
      <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2" onClick={close}>
        <XIcon className="h-4 w-4 stroke-muted-foreground" />
      </Button>
      <div className="flex flex-row items-center gap-1 text-sm font-light text-muted-foreground flex-1">
        <span className="flex flex-row items-center gap-1 font-medium">
          <Globe className="w-4 h-4" /> Network
        </span>{" "}
        / Details
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            <Sparkles className="h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuLabel className="flex flex-row items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Network Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* <DropdownMenuItem>
              Copy response
              <DropdownMenuShortcut>
                <Copy />
              </DropdownMenuShortcut>
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={remove}>
              <Trash className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarHeader>
  );
};
