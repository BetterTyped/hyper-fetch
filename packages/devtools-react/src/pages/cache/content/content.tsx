/* eslint-disable react/no-array-index-key */
import { NoContent } from "components/no-content/no-content";
import { Table } from "components/table/table";
import { useDevtoolsContext } from "devtools.context";
import { Item } from "./item/item";

const thStyle = {
  fontWeight: 400,
  fontSize: "14px",
  padding: "8px 5px",
};

export const Content = () => {
  const { cache } = useDevtoolsContext("DevtoolsNetworkContent");

  return (
    <>
      <Table>
        <thead style={{ opacity: !cache.length ? 0.4 : 1 }}>
          <tr style={{ textAlign: "left", color: "#60d6f6" }}>
            <th style={{ ...thStyle, paddingLeft: "10px" }}>Cache Key</th>
            {/* <th style={{ ...thStyle }}>>...</th> */}
            <th style={{ ...thStyle, paddingRight: "10px" }}>Timestamp</th>
          </tr>
        </thead>
        <tbody style={{ position: "relative" }}>
          {cache.map((item, index) => {
            return <Item key={index} item={item} />;
          })}
        </tbody>
      </Table>
      {!cache.length && <NoContent style={{ marginTop: "40px" }} text="No cache available!" />}
    </>
  );
};
