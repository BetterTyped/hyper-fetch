import { useDevtoolsContext } from "devtools.context";
import { Request } from "./request/request";

export const Content = () => {
  const { requests } = useDevtoolsContext("DevtoolsNetworkContent");

  return (
    <table style={{ width: "100%" }}>
      <thead>
        <tr style={{ textAlign: "left", color: "#60d6f6" }}>
          <th style={{ fontWeight: 400, fontSize: "14px", paddingLeft: "10px" }}>Endpoint</th>
          <th style={{ fontWeight: 400, fontSize: "14px" }}>Status</th>
          <th style={{ fontWeight: 400, fontSize: "14px" }}>Method</th>
          <th style={{ fontWeight: 400, fontSize: "14px", paddingRight: "10px" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((item) => {
          return <Request item={item} onClick={console.log} />;
        })}
      </tbody>
    </table>
  );
};
