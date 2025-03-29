/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/no-array-index-key */
import { NoContent } from "frontend/components/no-content/no-content";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "frontend/components/ui/table";
import { useSearch } from "frontend/hooks/use-search";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { Item } from "./item/item";

export const CacheList = () => {
  const {
    state: { cache, cacheSearchTerm },
  } = useDevtools();

  const { items } = useSearch({ data: cache, searchKeys: ["cacheKey"], searchTerm: cacheSearchTerm });

  if (!items.length) {
    return <NoContent text="Make some cached request to see them here!" />;
  }

  return (
    <Table className="w-full flex-1">
      <TableHeader style={{ opacity: !cache.length ? 0.4 : 1 }}>
        <TableRow>
          <TableHead>Cache Key</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Observers</TableHead>
          <TableHead>Last updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="relative">
        {items.map((item, index) => {
          return <Item key={index} item={item} />;
        })}
      </TableBody>
    </Table>
  );
};
