import { useStyles } from "theme/use-styles.hook";
import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";

import { styles } from "./processing.styles";

export const Processing = () => {
  const css = useStyles(styles);

  return (
    <>
      <Toolbar />
      <div className={css.wrapper}>
        <Content />
      </div>
    </>
  );
};
