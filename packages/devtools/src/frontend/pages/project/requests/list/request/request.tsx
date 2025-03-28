import { TreeItem, TreeItemRenderContext } from "react-complex-tree";
import { EllipsisIcon, FileUp } from "lucide-react";

import * as DropdownMenu from "frontend/components/dropdown/dropdown";
import { IconButton } from "frontend/components/icon-button/icon-button";
import { DevtoolsExplorerRequest } from "../content.types";
import { Method } from "frontend/components/method/method";

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
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton>
            <EllipsisIcon />
          </IconButton>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Label>
            <FileUp />
            Request
          </DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.Item onClick={renameRequest}>
              Rename
              <DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              Show cache
              <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              Show in network
              <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>Add example response</DropdownMenu.Item>
          <DropdownMenu.Item>Add request template</DropdownMenu.Item>
          <DropdownMenu.Item>View documentation</DropdownMenu.Item>
          <DropdownMenu.Item>Support</DropdownMenu.Item>
          <DropdownMenu.Item>API</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};
