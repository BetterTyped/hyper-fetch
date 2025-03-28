/* eslint-disable react/no-array-index-key */
import { CirclePlusIcon } from "lucide-react";
import { UncontrolledTreeEnvironment, Tree, TreeItem } from "react-complex-tree";

import * as DropdownMenu from "frontend/components/dropdown/dropdown";
import { Sidebar } from "frontend/components/sidebar/sidebar";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { NoContent } from "frontend/components/no-content/no-content";
import { useSearch } from "frontend/hooks/use-search";
import { DevtoolsExplorerItem } from "./content.types";
import { TreeElement } from "./tree-element/tree-element";
import { IconButton } from "frontend/components/icon-button/icon-button";
import { useExplorer } from "../requests.context";

// import { reactComplexTreeStyles } from "./react-complex-tree.styles";

export const ExplorerSidebar = () => {
  const { treeState } = useExplorer("ExplorerSidebar");
  const {
    state: { explorerRequests: requests, explorerSearchTerm },
    setDetailsExplorerRequest,
  } = useDevtools();
  // No lifecycle so we can use ref
  // const treeCss = reactComplexTreeStyles.useStyles();

  const { items } = useSearch({
    data: requests,
    searchKeys: ["endpoint", "method", "cacheKey"],
    searchTerm: explorerSearchTerm,
    baseSort: (a, b) => String(a.item.endpoint).localeCompare(String(b.item.endpoint)),
  });

  const handleSelect = async (item: TreeItem<DevtoolsExplorerItem>) => {
    if (item.data.type === "request") {
      const element = item.data;
      setDetailsExplorerRequest((prev) => {
        if (prev === element) return null;
        return element;
      });
    }
  };

  const addNewFolder = () => {
    treeState.injectItem(window.prompt("Item name") ?? "New item", "root");
  };

  if (!items.length) {
    return <NoContent text="Make some request to see them here!" />;
  }

  return (
    // className={treeCss.clsx(treeCss.styles)}
    <Sidebar position="right">
      <div className="flex justify-between items-center px-2 pt-[5px] pb-0">
        <span className="text-xs font-semibold text-light-500 dark:text-dark-50">Collection</span>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <IconButton>
              <CirclePlusIcon />
            </IconButton>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content>
            <DropdownMenu.Item onClick={addNewFolder}>
              Add folder
              <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <UncontrolledTreeEnvironment
        dataProvider={treeState}
        getItemTitle={(item) => item.data.name}
        canSearchByStartingTyping
        canDragAndDrop
        canDropOnFolder
        canReorderItems
        canRename
        canSearch
        onPrimaryAction={handleSelect}
        renderItemTitle={TreeElement}
        viewState={{
          "tree-1": {
            expandedItems: ["requests"],
          },
        }}
      >
        <Tree treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
      </UncontrolledTreeEnvironment>
    </Sidebar>
  );
};
