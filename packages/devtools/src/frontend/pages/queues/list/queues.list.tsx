/* eslint-disable react/no-array-index-key */
import { useDevtoolsContext } from "frontend/devtools.context";
import { Card } from "./card/card";
import { NoContent } from "frontend/components/no-content/no-content";
import { useSearch } from "frontend/hooks/use-search";
import { createStyles } from "frontend/theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    wrapper: css`
      width: 100%;
      flex: 1 1 auto;
      overflow-y: auto;
    `,
    row: css`
      display: flex;
      flex-direction: row;
      gap: 10px;
      flex-wrap: wrap;
    `,
  };
});

// Rename to list
export const QueuesList = () => {
  const css = styles.useStyles();
  const { queues, processingSearchTerm } = useDevtoolsContext("QueuesSidebar");

  const { items } = useSearch({
    data: queues,
    searchKeys: ["queryKey"],
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
