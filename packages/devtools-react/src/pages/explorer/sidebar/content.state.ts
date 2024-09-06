import { getUniqueRequestId, RequestInstance } from "@hyper-fetch/core";
import { Disposable, TreeDataProvider, TreeItem, TreeItemIndex } from "react-complex-tree";

import { DevtoolsExplorerFolder, DevtoolsExplorerItem } from "./content.types";

export class DevtoolsDataProvider implements TreeDataProvider {
  private data: Record<TreeItemIndex, TreeItem<DevtoolsExplorerItem>> = {};

  constructor(items: RequestInstance[]) {
    this.data = items.reduce(
      (acc, item, index) => {
        acc[item.cacheKey + index] = {
          index: item.cacheKey + index,
          children: [],
          canRename: true,
          canMove: true,
          isFolder: false,
          data: {
            type: "request",
            name: item.endpoint,
            request: item,
          },
        };

        return acc;
      },
      {
        root: {
          index: "root",
          canRename: false,
          canMove: false,
          isFolder: true,
          children: items
            .sort((a, b) => a.endpoint.localeCompare(b.endpoint))
            .map((item, index) => item.cacheKey + index),
          data: {
            type: "folder",
            name: "Root",
            canDelete: false,
          },
        },
      } as Record<TreeItemIndex, TreeItem<DevtoolsExplorerItem>>,
    );
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
    const newItem: TreeItem<DevtoolsExplorerItem> = {
      ...item,
      data: {
        ...item.data,
        name,
      },
    };
    this.data[item.index] = newItem;
  }

  public injectItem(name: string, folderId: TreeItemIndex = "requests") {
    const id = getUniqueRequestId(name);
    const newElement: TreeItem<DevtoolsExplorerFolder> = {
      index: id,
      canMove: true,
      isFolder: true,
      children: [],
      data: {
        type: "folder",
        name,
        canDelete: true,
      },
      canRename: true,
    };
    this.data[id] = newElement;
    this.data[folderId].children?.push(id);
    this.treeChangeListeners.forEach((listener) => listener([folderId]));
  }
}
