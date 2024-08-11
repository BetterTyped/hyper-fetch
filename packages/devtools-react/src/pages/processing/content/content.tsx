/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";
import { Card } from "./card/card";

import { styles } from "../processing.styles";

export const Content = () => {
  const css = styles.useStyles();
  const { queues } = useDevtoolsContext("DevtoolsProcessingContent");
  return (
    <div style={{ padding: "10px 20px" }}>
      <div className={css.row}>
        {queues.map((queue, index) => {
          return <Card key={index} queue={queue} />;
        })}
        {!queues.length && (
          <div style={{ color: "#a7a7a7", fontSize: "14px" }}>
            No fetch queues, trigger your requests to see data here.
          </div>
        )}
      </div>
    </div>
  );
};
