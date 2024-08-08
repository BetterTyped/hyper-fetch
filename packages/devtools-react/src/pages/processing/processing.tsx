import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";

import { styles } from "./processing.styles";

export const Processing = () => {
  const css = styles.useStyles();

  return (
    <>
      <Toolbar />
      <div className={css.wrapper}>
        <Content />
      </div>
    </>
  );
};
