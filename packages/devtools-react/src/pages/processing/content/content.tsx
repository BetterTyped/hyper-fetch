/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";
import { Card } from "./card/card";

export const Content = () => {
  const { fetchQueues, submitQueues } = useDevtoolsContext("DevtoolsProcessingContent");
  return (
    <div style={{ padding: "0 10px 20px" }}>
      <h4>Fetch Queues</h4>
      <div style={{ display: "flex" }}>
        {fetchQueues.map((queue, index) => {
          return <Card key={index} queue={queue} />;
        })}
        {!fetchQueues.length && (
          <div style={{ color: "#a7a7a7", fontSize: "14px" }}>
            No fetch queues, trigger your requests to see data here.
          </div>
        )}
      </div>
      {/* Todo make a switcher between fetch/submit queues */}
      <h4>Submit Queues</h4>
      <div style={{ display: "flex" }}>
        {submitQueues.map((queue, index) => {
          return <Card key={index} queue={queue} />;
        })}
        {!submitQueues.length && (
          <div style={{ color: "#a7a7a7", fontSize: "14px" }}>
            No submit queues, trigger your requests to see data here.
          </div>
        )}
      </div>
    </div>
  );
};
