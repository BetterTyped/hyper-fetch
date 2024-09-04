/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "devtools.context";
import { Card } from "./card/card";
import { NoContent } from "components/no-content/no-content";
import { useSearch } from "hooks/use-search";

import { styles } from "./queues.styles";

export const QueuesSidebar = () => {
  const css = styles.useStyles();
  const { queues, processingSearchTerm } = useDevtoolsContext("DevtoolsQueuesContent");

  const { items } = useSearch({
    data: queues,
    searchKeys: ["queueKey"],
    searchTerm: processingSearchTerm,
  });

  if (!items.length) {
    return <NoContent text="Make some request to see them here!" />;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.row}>
        {items.map((queue, index) => {
          return <Card key={index} queue={queue} />;
        })}
      </div>
    </div>
  );
};
