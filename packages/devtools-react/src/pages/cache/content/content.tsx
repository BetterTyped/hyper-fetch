/* eslint-disable react/no-array-index-key */
import { NoContent } from "components/no-content/no-content";
import { Table } from "components/table/table";
import { useDevtoolsContext } from "devtools.context";
import { Item } from "./item/item";

import { styles } from "../cache.styles";

export const Content = () => {
  const { cache } = useDevtoolsContext("DevtoolsNetworkContent");
  const css = styles.useStyles();

  return (
    <>
      <Table>
        <thead style={{ opacity: !cache.length ? 0.4 : 1 }}>
          <tr>
            <th className={css.label}>Cache Key</th>
            {/* <th style={{ ...thStyle }}>>...</th> */}
            <th className={css.label}>Timestamp</th>
          </tr>
        </thead>
        <tbody className={css.tbody}>
          {cache.map((item, index) => {
            return <Item key={index} item={item} />;
          })}
        </tbody>
      </Table>
      {!cache.length && <NoContent style={{ marginTop: "40px" }} text="No cache available!" />}
    </>
  );
};
