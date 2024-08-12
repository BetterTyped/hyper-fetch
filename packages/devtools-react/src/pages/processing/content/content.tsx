/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";
import { Card } from "./card/card";
import { NoContent } from "components/no-content/no-content";

import { styles } from "../processing.styles";

export const Content = () => {
  const css = styles.useStyles();
  const { queues } = useDevtoolsContext("DevtoolsProcessingContent");
  return (
    <div style={{ padding: "10px 20px" }} className={css.wrapper}>
      <div className={css.row}>
        {queues.map((queue, index) => {
          return <Card key={index} queue={queue} />;
        })}
        {!queues.length && <NoContent text="No queues at the moment, trigger your requests to see data here" />}
      </div>
    </div>
  );
};
