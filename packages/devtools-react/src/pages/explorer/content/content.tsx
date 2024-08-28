/* eslint-disable react/no-array-index-key */
import { useRef } from "react";
import { RequestInstance } from "@hyper-fetch/core";
import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider, TreeItem, TreeItemIndex } from "react-complex-tree";

import { useDevtoolsContext } from "devtools.context";
import { Table } from "components/table/table";
import { NoContent } from "components/no-content/no-content";
import { useSearch } from "hooks/use-search";

type DevtoolsExplorerItem = {
  name: string;
  request: RequestInstance;
};

export const Content = () => {
  const { client, explorerSearchTerm, setDetailsExplorerRequest } = useDevtoolsContext("DevtoolsNetworkContent");
  // No lifecycle so we can use ref
  const requests = useRef([...client.__requestsMap.values()]).current;

  const { items } = useSearch({
    data: requests,
    searchKeys: ["endpoint", "method", "cacheKey"],
    searchTerm: explorerSearchTerm,
    baseSort: (a, b) => String(a.item.endpoint).localeCompare(String(b.item.endpoint)),
  });

  const initialState = {
    items: items.reduce(
      (acc, item) => {
        acc[item.cacheKey] = {
          index: item.cacheKey,
          children: [],
          canRename: false,
          canMove: false,
          isFolder: false,
          data: {
            name: item.cacheKey,
            request: item,
          },
        };

        return acc;
      },
      {} as Record<TreeItemIndex, TreeItem<DevtoolsExplorerItem>>,
    ),
  };

  const state = useRef(new StaticTreeDataProvider(initialState as any, (item, data) => ({ ...item, data })));

  if (!items.length) {
    return <NoContent text="Make some request to see them here!" />;
  }

  return (
    <Table>
      <UncontrolledTreeEnvironment
        dataProvider={state.current}
        getItemTitle={() => "item.data"}
        canSearchByStartingTyping
        viewState={{}}
        onFocusItem={(item) => setDetailsExplorerRequest(item.data)}
      >
        <Tree treeId="tree-1" rootItem="root" treeLabel="Tree Example" />
      </UncontrolledTreeEnvironment>
    </Table>
  );
};
