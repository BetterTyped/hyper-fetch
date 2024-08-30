/* eslint-disable react/no-array-index-key */
import { useRef } from "react";
import { UncontrolledTreeEnvironment, Tree, TreeItem } from "react-complex-tree";

import { useDevtoolsContext } from "devtools.context";
import { NoContent } from "components/no-content/no-content";
import { useSearch } from "hooks/use-search";
import { DevtoolsExplorerItem } from "./content.types";
import { TreeElement } from "./tree-element/tree-element";

import { reactComplexTreeStyles } from "./react-complex-tree.styles";
import { styles } from "../explorer.styles";

export const Content = () => {
  const { client, treeState, explorerSearchTerm, setDetailsExplorerRequest } =
    useDevtoolsContext("DevtoolsNetworkContent");
  // No lifecycle so we can use ref
  const requests = useRef([...client.__requestsMap.values()]).current;
  const css = styles.useStyles();
  const treeCss = reactComplexTreeStyles.useStyles();

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

  if (!items.length) {
    return <NoContent text="Make some request to see them here!" />;
  }

  return (
    <div className={css.clsx(css.content, treeCss.styles)}>
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
    </div>
  );
};
