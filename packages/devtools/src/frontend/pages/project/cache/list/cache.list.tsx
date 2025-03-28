/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/no-array-index-key */
import { NoContent } from "frontend/components/no-content/no-content";
import * as Table from "frontend/components/table/table";
import { Item } from "./item/item";
import { useSearch } from "frontend/hooks/use-search";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const CacheList = () => {
  const {
    state: { cache, cacheSearchTerm },
  } = useDevtools();

  const { items } = useSearch({ data: cache, searchKeys: ["cacheKey"], searchTerm: cacheSearchTerm });

  if (!items.length) {
    return <NoContent text="Make some cached request to see them here!" />;
  }

  return (
    <Table.Root className="w-full flex-1">
      <Table.Header style={{ opacity: !cache.length ? 0.4 : 1 }}>
        <Table.Row>
          <Table.Head>Cache Key</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>Observers</Table.Head>
          <Table.Head>Last updated</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body className="relative">
        {items.map((item, index) => {
          return <Item key={index} item={item} />;
        })}
      </Table.Body>
    </Table.Root>
  );
};
