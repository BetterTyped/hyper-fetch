/* eslint-disable react/no-array-index-key */
import { Table } from "components/table/table";
import { useDevtoolsContext } from "devtools.context";
import { Log } from "./log/log";
import { NoContent } from "components/no-content/no-content";

const thStyle = {
  fontWeight: 400,
  fontSize: "14px",
  padding: "8px 5px",
};

export const Content = () => {
  const { logs } = useDevtoolsContext("DevtoolsLogsContent");

  return (
    <>
      <Table>
        <thead style={{ opacity: !logs.length ? 0.4 : 1 }}>
          <tr style={{ textAlign: "left", color: "#60d6f6" }}>
            <th style={{ ...thStyle, paddingLeft: "10px" }}>Message</th>
            {/* <th style={{ ...thStyle }}>>...</th> */}
            <th style={{ ...thStyle, paddingRight: "10px" }}>Severity</th>
          </tr>
        </thead>
        <tbody style={{ position: "relative" }}>
          {logs.map((log, index) => {
            return <Log key={index} item={log} />;
          })}
        </tbody>
      </Table>
      {!logs.length && <NoContent style={{ marginTop: "40px" }} text="No logs available!" />}
    </>
  );
};
