/* eslint-disable react/no-array-index-key */
import { useRef } from "react";

import { useDevtoolsContext } from "devtools.context";
import { Request } from "./request/request";
import { Table } from "components/table/table";
import { NoContent } from "components/no-content/no-content";
import { useSearch } from "hooks/use-search";
import { Label } from "components/table/label/label";

import { styles } from "../explorer.styles";

export const Content = () => {
  const { client, explorerSearchTerm } = useDevtoolsContext("DevtoolsNetworkContent");
  const css = styles.useStyles();
  // No lifecycle so we can use ref
  const requests = useRef([...client.__requestsMap.values()]).current;

  const { items } = useSearch({
    data: requests,
    searchKeys: ["endpoint", "method", "cacheKey"],
    searchTerm: explorerSearchTerm,
    baseSort: (a, b) => String(a.item.endpoint).localeCompare(String(b.item.endpoint)),
  });

  if (!items.length) {
    return <NoContent text="Make some request to see them here!" />;
  }

  return (
    <Table>
      <thead style={{ opacity: !requests.length ? 0.4 : 1 }}>
        <tr>
          <Label>Endpoint</Label>
          <Label>Method</Label>
          <Label>Success</Label>
          <Label>Timestamp</Label>
        </tr>
      </thead>
      <tbody className={css.tbody}>
        {items.map((item, index) => {
          return <Request key={index} item={item} />;
        })}
      </tbody>
    </Table>
  );
};
