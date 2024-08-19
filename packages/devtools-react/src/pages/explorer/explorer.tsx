import { useRef } from "react";

import { useDevtoolsContext } from "devtools.context";
import { Table } from "components/table/table";
import { Label } from "../../components/table/label/label";
import { Toolbar } from "./toolbar/toolbar";
import { Request } from "./request/request";
import { useSearch } from "hooks/use-search";

// TODO - show called times
// TODO - show (?) called requests from network?

export const Explorer = () => {
  const { client, explorerSearchTerm } = useDevtoolsContext("DevtoolsExplorer");
  // No lifecycle so we can use ref
  const requests = useRef([...client.__requestsMap.values()]).current;

  const { items } = useSearch({
    data: requests,
    searchKeys: ["endpoint", "method", "cacheKey"],
    searchTerm: explorerSearchTerm,
    baseSort: (a, b) => String(a.item.endpoint).localeCompare(String(b.item.endpoint)),
  });
  return (
    <>
      <Toolbar />
      <Table>
        <thead style={{ opacity: !requests ? 0.4 : 1 }}>
          <tr>
            <Label>Endpoint</Label>
            <Label>Method</Label>
            <Label>Cache Key</Label>
            <Label>Times called</Label>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            // eslint-disable-next-line react/no-array-index-key
            return <Request key={index} item={item} />;
          })}
        </tbody>
      </Table>
    </>
  );
};
