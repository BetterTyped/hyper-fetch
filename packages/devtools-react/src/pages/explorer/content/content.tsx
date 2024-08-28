/* eslint-disable react/no-array-index-key */
import { useRef } from "react";
import { RequestInstance, getUniqueRequestId } from "@hyper-fetch/core";
import {
  UncontrolledTreeEnvironment,
  Tree,
  TreeItem,
  TreeItemIndex,
  TreeDataProvider,
  Disposable,
} from "react-complex-tree";

import { useDevtoolsContext } from "devtools.context";
import { NoContent } from "components/no-content/no-content";
import { useSearch } from "hooks/use-search";
import { Button } from "components/button/button";

import { styles } from "../explorer.styles";

export type DevtoolsExplorerRequest = {
  type: "request";
  name: string;
  request: RequestInstance;
};
export type DevtoolsExplorerFolder = {
  type: "folder";
  name: string;
};

type DevtoolsExplorerItem = DevtoolsExplorerRequest | DevtoolsExplorerFolder;

class DevtoolsDataProvider implements TreeDataProvider {
  private data: Record<TreeItemIndex, TreeItem<DevtoolsExplorerItem>> = {};
  private setItemName?: (item: TreeItem<DevtoolsExplorerItem>, newName: string) => TreeItem<DevtoolsExplorerItem>;

  constructor(
    initialData: Record<TreeItemIndex, TreeItem<DevtoolsExplorerItem>>,
    setItemName?: (item: TreeItem<DevtoolsExplorerItem>, newName: string) => TreeItem<DevtoolsExplorerItem>,
  ) {
    this.data = initialData;
    this.setItemName = setItemName;
  }

  private treeChangeListeners: ((changedItemIds: TreeItemIndex[]) => void)[] = [];

  public async getTreeItem(itemId: TreeItemIndex) {
    return this.data[itemId];
  }

  public getTreeItemSync(itemId: TreeItemIndex) {
    return this.data[itemId];
  }

  public async onChangeItemChildren(itemId: TreeItemIndex, newChildren: TreeItemIndex[]) {
    this.data[itemId].children = newChildren;
    this.treeChangeListeners.forEach((listener) => listener([itemId]));
  }

  public onDidChangeTreeData(listener: (changedItemIds: TreeItemIndex[]) => void): Disposable {
    this.treeChangeListeners.push(listener);
    return {
      dispose: () => this.treeChangeListeners.splice(this.treeChangeListeners.indexOf(listener), 1),
    };
  }

  public async onRenameItem(item: TreeItem<DevtoolsExplorerItem>, name: string): Promise<void> {
    if (this.setItemName) {
      this.data[item.index] = this.setItemName(item, name);
    }
  }

  public injectItem(name: string) {
    const id = getUniqueRequestId(name);
    const newElement: TreeItem<DevtoolsExplorerFolder> = {
      index: id,
      canMove: true,
      isFolder: true,
      children: [],
      data: {
        type: "folder",
        name,
      },
      canRename: true,
    };
    this.data[id] = newElement;
    this.data.root.children?.push(id);
    this.treeChangeListeners.forEach((listener) => listener(["root"]));
  }
}

export const Content = () => {
  const { client, explorerSearchTerm } = useDevtoolsContext("DevtoolsNetworkContent");
  // No lifecycle so we can use ref
  const requests = useRef([...client.__requestsMap.values()]).current;
  const css = styles.useStyles();

  const { items } = useSearch({
    data: requests,
    searchKeys: ["endpoint", "method", "cacheKey"],
    searchTerm: explorerSearchTerm,
    baseSort: (a, b) => String(a.item.endpoint).localeCompare(String(b.item.endpoint)),
  });

  const initialState = items.reduce(
    (acc, item, index) => {
      acc[item.cacheKey + index] = {
        index: item.cacheKey + index,
        children: [],
        canRename: true,
        canMove: true,
        isFolder: false,
        data: {
          type: "request",
          name: item.cacheKey,
          request: item,
        },
      };

      return acc;
    },
    {
      root: {
        index: "root",
        canRename: true,
        canMove: true,
        isFolder: true,
        children: items.map((item, index) => item.cacheKey + index),
        data: {
          type: "folder",
          name: "Requests",
        },
      },
    } as Record<TreeItemIndex, TreeItem<DevtoolsExplorerItem>>,
  );

  const state = useRef(new DevtoolsDataProvider(initialState));

  // const handleSelect = async (treeId: TreeItemIndex) => {
  //   const item = state.current.getTreeItemSync(treeId);

  //   console.log(item);
  //   if (!item) return;

  //   if (item.data.type === "request") {
  //     setDetailsExplorerRequest(item.data);
  //   }
  // };

  const addNewFolder = () => {
    state.current.injectItem(window.prompt("Item name") ?? "New item");
  };

  if (!items.length) {
    return <NoContent text="Make some request to see them here!" />;
  }

  return (
    <div className={css.content}>
      <UncontrolledTreeEnvironment
        dataProvider={state.current}
        getItemTitle={(item) => item.data.name}
        canSearchByStartingTyping
        viewState={{}}
        canDragAndDrop
        canDropOnFolder
        canReorderItems
        canRename
        canSearch
        keyboardBindings={{
          primaryAction: ["f3"],
          renameItem: ["control+e"],
          abortRenameItem: ["control"],
          startProgrammaticDnd: ["f2"],
          completeProgrammaticDnd: ["control"],
          abortProgrammaticDnd: ["enter"],
        }}
        // onSelectItems={(items) => {
        //   handleSelect(initialState[items[0]]);
        // }}
        // renderItemTitle={(item) => {
        //   return (
        //     // Without it drag and drop is not working
        //     // eslint-disable-next-line jsx-a11y/interactive-supports-focus
        //     <div
        //       role="button"
        //       onKeyDown={(e) => {
        //         if (e.key === "Enter") {
        //           handleSelect(item.item.index);
        //         }
        //       }}
        //       onClick={() => {
        //         handleSelect(item.item.index);
        //       }}
        //     >
        //       {item.title}
        //     </div>
        //   );
        // }}
      >
        <Button onClick={addNewFolder}>Add new folder</Button>
        <Tree treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
      </UncontrolledTreeEnvironment>
    </div>
  );
};
