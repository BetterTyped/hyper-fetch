import { TreeInformation, TreeItem, TreeItemRenderContext } from "react-complex-tree";

import { DevtoolsExplorerFolder, DevtoolsExplorerItem, DevtoolsExplorerRequest } from "../content.types";
import { Folder } from "../folder/folder";
import { Request } from "../request/request";

export const TreeElement = (props: {
  title: string;
  item: TreeItem<DevtoolsExplorerItem>;
  context: TreeItemRenderContext<"expandedItems">;
  info: TreeInformation;
}) => {
  const { item } = props;
  if (item.data.type === "folder") {
    return <Folder {...props} item={item as TreeItem<DevtoolsExplorerFolder>} />;
  }
  return <Request {...props} item={item as TreeItem<DevtoolsExplorerRequest>} />;
};
