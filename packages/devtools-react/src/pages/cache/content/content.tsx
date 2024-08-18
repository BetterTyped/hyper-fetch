/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/no-array-index-key */
import { NoContent } from "components/no-content/no-content";
import { Table } from "components/table/table";
import { useDevtoolsContext } from "devtools.context";
import { Item } from "./item/item";
import { useSearch } from "hooks/use-search";
import { Label } from "components/table/label/label";

export const Content = () => {
  const { cache, cacheSearchTerm } = useDevtoolsContext("DevtoolsNetworkContent");

  const { items } = useSearch({ data: cache, searchKeys: ["cacheKey"], searchTerm: cacheSearchTerm });

  if (!items.length) {
    return <NoContent text="Make some cached request to see them here!" />;
  }

  return (
    <Table>
      <thead style={{ opacity: !cache.length ? 0.4 : 1 }}>
        <tr>
          <Label>Cache Key</Label>
          <Label>Status</Label>
          <Label>Observers</Label>
          <Label>Last updated</Label>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          return <Item key={index} item={item} />;
        })}
      </tbody>
    </Table>
  );
};
