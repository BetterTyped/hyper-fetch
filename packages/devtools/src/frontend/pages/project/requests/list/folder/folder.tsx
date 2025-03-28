import { TreeItem, TreeItemRenderContext } from "react-complex-tree";
import { EllipsisIcon, FolderIcon } from "lucide-react";

import * as DropdownMenu from "frontend/components/dropdown/dropdown";
import { IconButton } from "frontend/components/icon-button/icon-button";
import { DevtoolsExplorerFolder } from "../content.types";
import { useExplorer } from "../../requests.context";

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

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton>
            <EllipsisIcon />
          </IconButton>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Label>
            <FolderIcon />
            Folder
          </DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            {item.canRename && (
              <DropdownMenu.Item onClick={renameFolder}>
                Rename
                <DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item onClick={addNewFolder}>
              Add folder
              <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              Run folder
              <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              View documentation
              <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>Add Request</DropdownMenu.Item>
          <DropdownMenu.Item>View documentation</DropdownMenu.Item>
          <DropdownMenu.Item>Support</DropdownMenu.Item>
          <DropdownMenu.Item>API</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};
