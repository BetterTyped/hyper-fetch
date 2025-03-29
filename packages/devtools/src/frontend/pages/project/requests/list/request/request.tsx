import { TreeItem, TreeItemRenderContext } from "react-complex-tree";
import { EllipsisIcon, FileUp } from "lucide-react";

import { DevtoolsExplorerRequest } from "../content.types";
import { Method } from "frontend/components/ui/method";
import { Button } from "frontend/components/ui/button";
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

export const Request = ({
  item,
  context,
}: {
  item: TreeItem<DevtoolsExplorerRequest>;
  context: TreeItemRenderContext<"expandedItems">;
}) => {
  const renameRequest = () => {
    context.startRenamingItem();
  };

  return (
    <div className="w-full flex items-center justify-between">
      <span className="flex items-center gap-[5px]">
        <Method method={item.data.request.method} />
        {item.data.name}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuLabel>
            <FileUp />
            Request
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={renameRequest}>
              Rename
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Show cache
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Show in network
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Add example response</DropdownMenuItem>
          <DropdownMenuItem>Add request template</DropdownMenuItem>
          <DropdownMenuItem>View documentation</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem>API</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
