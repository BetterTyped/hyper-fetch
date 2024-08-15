/* eslint-disable react/no-array-index-key */
import { NoContent } from "components/no-content/no-content";
import { Table } from "components/table/table";
import { useDevtoolsContext } from "devtools.context";
import { Item } from "./item/item";
import { useSearch } from "hooks/use-search";

import { styles } from "../cache.styles";

export const Content = () => {
  const { cache, cacheSearchTerm } = useDevtoolsContext("DevtoolsNetworkContent");
  const css = styles.useStyles();

  const { items } = useSearch({ data: cache, searchKeys: ["cacheKey"], searchTerm: cacheSearchTerm });

  return (
    <>
      <Table>
        <thead style={{ opacity: !cache.length ? 0.4 : 1 }}>
          <tr>
            <th className={css.label}>Cache Key</th>
            <th className={css.label}>Observers</th>
            <th className={css.label}>Last updated</th>
          </tr>
        </thead>
        <tbody className={css.tbody}>
          {items.map((item, index) => {
            return <Item key={index} item={item} />;
          })}
        </tbody>
      </Table>
      {!items.length && <NoContent style={{ marginTop: "40px" }} text="No cache available!" />}
    </>
  );
};
