import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";
import { useDevtoolsContext } from "devtools.context";
import { Details } from "./details/details";

import { styles } from "./processing.styles";

export const Processing = () => {
  const css = styles.useStyles();
  const { detailsQueueKey } = useDevtoolsContext("DevtoolsProcessingContent");

  return (
    <>
      <Toolbar />
      <div className={css.wrapper}>
        <Content />
      </div>
      {detailsQueueKey && <Details queueKey={detailsQueueKey} />}
    </>
  );
};
