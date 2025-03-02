/* eslint-disable react/no-array-index-key */
import { useRef } from "react";
import { CirclePlusIcon } from "lucide-react";
import { UncontrolledTreeEnvironment, Tree, TreeItem } from "react-complex-tree";

import * as DropdownMenu from "frontend/components/dropdown/dropdown";
import { Sidebar } from "frontend/components/sidebar/sidebar";
import { useDevtoolsContext } from "frontend/pages/project/_context/devtools.context";
import { NoContent } from "frontend/components/no-content/no-content";
import { useSearch } from "frontend/hooks/use-search";
import { DevtoolsExplorerItem } from "./content.types";
import { TreeElement } from "./tree-element/tree-element";
import { createStyles } from "frontend/theme/use-styles.hook";
import { IconButton } from "frontend/components/icon-button/icon-button";

import { reactComplexTreeStyles } from "./react-complex-tree.styles";

const styles = createStyles(({ isLight, css, tokens }) => {
  return {
    row: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 8px 0;
    `,
    title: css`
      font-size: 12px;
      font-weight: 600;
      color: ${isLight ? tokens.colors.light[500] : tokens.colors.dark[50]};
    `,
  };
});

export const ExplorerSidebar = () => {
  const { client, treeState, explorerSearchTerm, setDetailsExplorerRequest } =
    useDevtoolsContext("DevtoolsNetworkContent");
  // No lifecycle so we can use ref
  const requests = useRef([...client.__requestsMap.values()]).current;
  const treeCss = reactComplexTreeStyles.useStyles();
  const css = styles.useStyles();

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
    <Sidebar position="right" className={treeCss.clsx(treeCss.styles)}>
      <div className={css.row}>
        <span className={css.title}>Collection</span>
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
