import { TreeItem } from "react-complex-tree";

import { DevtoolsExplorerFolder, DevtoolsExplorerItem, DevtoolsExplorerRequest } from "../content.types";
import { Folder } from "../folder/folder";
import { Request } from "../request/request";

export const TreeElement = ({ item }: { item: TreeItem<DevtoolsExplorerItem> }) => {
  if (item.data.type === "folder") {
    return <Folder item={item as TreeItem<DevtoolsExplorerFolder>} />;
  }
  return <Request item={item as TreeItem<DevtoolsExplorerRequest>} />;
};
