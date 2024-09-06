import { ListXIcon } from "lucide-react";

import { Toolbar } from "components/toolbar/toolbar";
import { Search } from "components/search/search";
import { useDevtoolsContext } from "devtools.context";
import { Button } from "components/button/button";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles(({ css }) => {
  return {
    spacer: css`
      flex: 1 1 auto;
    `,
  };
});

export const NetworkToolbar = () => {
  const { setNetworkSearchTerm, clearNetwork } = useDevtoolsContext("ToolbarNetwork");

  const css = styles.useStyles();

  return (
    <Toolbar>
      <Search placeholder="Search" onChange={(e) => setNetworkSearchTerm(e.target.value)} />
      <div className={css.spacer} />
      <Button color="gray" onClick={clearNetwork}>
        <ListXIcon />
        Clear network
      </Button>
    </Toolbar>
  );
};
