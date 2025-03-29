import { TreeItem, TreeItemRenderContext } from "react-complex-tree";
import { EllipsisIcon, FolderIcon } from "lucide-react";

import { DevtoolsExplorerFolder } from "../content.types";
import { useExplorer } from "../../requests.context";
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

export const Folder = ({
  item,
  context,
}: {
  item: TreeItem<DevtoolsExplorerFolder>;
  context: TreeItemRenderContext<"expandedItems">;
}) => {
  const { treeState } = useExplorer("Folder");

  const addNewFolder = () => {
    treeState.injectItem(window.prompt("Item name") ?? "New item", item.index);
  };

  const renameFolder = () => {
    context.startRenamingItem();
  };

  return (
    <div className="w-full flex items-center justify-between">
      <span className="flex items-center gap-[5px]">
        <FolderIcon className="w-4 h-4" />
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
            <FolderIcon />
            Folder
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {item.canRename && (
              <DropdownMenuItem onClick={renameFolder}>
                Rename
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={addNewFolder}>
              Add folder
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Run folder
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              View documentation
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Add Request</DropdownMenuItem>
          <DropdownMenuItem>View documentation</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem>API</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
