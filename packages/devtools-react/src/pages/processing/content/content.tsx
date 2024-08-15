/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";
import { Card } from "./card/card";
import { NoContent } from "components/no-content/no-content";
import { useSearch } from "hooks/use-search";

import { styles } from "../processing.styles";

export const Content = () => {
  const css = styles.useStyles();
  const { queues, processingSearchTerm } = useDevtoolsContext("DevtoolsProcessingContent");

  const { items } = useSearch({
    data: queues,
    searchKeys: ["queueKey"],
    searchTerm: processingSearchTerm,
  });

  return (
    <div style={{ padding: "10px 20px" }} className={css.wrapper}>
      <div className={css.row}>
        {items.map((queue, index) => {
          return <Card key={index} queue={queue} />;
        })}
        {!items.length && <NoContent text="No queues at the moment, trigger your requests to see data here" />}
      </div>
    </div>
  );
};
