import { EllipsisVertical, Trash, XIcon, Globe } from "lucide-react";

import { SidebarHeader } from "frontend/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "frontend/components/ui/dropdown-menu";
import { Button } from "frontend/components/ui/button";
import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useNetworkStore } from "frontend/store/project/network.store";

export const SectionToolbar = ({ item }: { item: DevtoolsRequestEvent }) => {
  const { project } = useDevtools();
  const removeNetworkRequest = useNetworkStore((state) => state.removeNetworkRequest);
  const openDetails = useNetworkStore((state) => state.openDetails);

  const close = () => {
    openDetails({ project: project.name, requestId: "" });
  };

  const remove = () => {
    removeNetworkRequest({ project: project.name, requestId: item.requestId ?? "" });
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
          <Button variant="ghost" size="icon">
            <EllipsisVertical className="w-3 h-3 stroke-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="bottom" align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* <DropdownMenuItem>
              Copy response
              <DropdownMenuShortcut>
                <Copy />
              </DropdownMenuShortcut>
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={remove}>
              Remove
              <DropdownMenuShortcut>
                <Trash />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarHeader>
  );
};
