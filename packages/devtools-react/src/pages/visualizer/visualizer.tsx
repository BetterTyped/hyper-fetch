import { RequestInstance } from "@hyper-fetch/core";

import { useDevtoolsContext } from "devtools.context";
import { Table } from "components/table/table";
import { Label } from "../../components/table/label/label";
import { Toolbar } from "./toolbar";
import { Request } from "./request/request";

// TODO - show called times
// TODO - show (?) called requests from network?

const sortRequests = (requests: RequestInstance[]) => {
  return requests.sort((a, b) => a.endpoint > b.endpoint || a.method > b.method);
};

const markDuplicatedRequests = (requests: RequestInstance[]) => {
  return requests.map((request, index) => {
    const prevRequest = requests[index - 1];
    if (prevRequest && prevRequest.method === request.method && prevRequest.endpoint === request.endpoint) {
      return { ...request, isDuplicated: true };
    }
    return {...request, isDuplicated: : false}
  });
};

export const Visualizer = () => {
  const { client } = useDevtoolsContext("DevtoolsVisualizer");
  const requests = sortRequests([...client.__requestsMap.values()]);
  return (
    <>
      <Toolbar />
      <Table>
        <thead style={{ opacity: !requests ? 0.4 : 1 }}>
          <tr>
            <Label>Method</Label>
            <Label>Endpoint</Label>
            <Label>Cache Key</Label>
            <Label>Times called</Label>
          </tr>
        </thead>
        <tbody>
          {requests.map((item, index) => {
            return <Request key={index} item={item} />;
          })}
        </tbody>
      </Table>
    </>
  );
};
