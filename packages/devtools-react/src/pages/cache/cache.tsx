import { Content } from "./content/content";
import { Toolbar } from "./toolbar/toolbar";

import { styles } from "./cache.styles";

// TODO: Info about hydration - "is hydrated"?
// How much time left to garbage collect?
// How much time left for cache?
export const Cache = () => {
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
