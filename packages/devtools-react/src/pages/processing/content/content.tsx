/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";
import { Card } from "./card/card";

import { styles } from "../processing.styles";

export const Content = () => {
  const css = styles.useStyles();
  const { fetchQueues, submitQueues } = useDevtoolsContext("DevtoolsProcessingContent");
  return (
    <div style={{ padding: "0 10px 20px" }}>
      <h4>Fetch Queues</h4>
      <div className={css.row}>
        {fetchQueues.map((queue, index) => {
          return <Card key={index} queue={queue} type="fetchDispatcher" />;
        })}
        {!fetchQueues.length && (
          <div style={{ color: "#a7a7a7", fontSize: "14px" }}>
            No fetch queues, trigger your requests to see data here.
          </div>
        )}
      </div>
      {/* Todo make a switcher between fetch/submit queues */}
      <h4>Submit Queues</h4>
      <div className={css.row}>
        {submitQueues.map((queue, index) => {
          return <Card key={index} queue={queue} type="submitDispatcher" />;
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
