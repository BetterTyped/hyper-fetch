import { ListXIcon } from "lucide-react";

import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { useDevtoolsContext } from "devtools.context";
import { Button } from "components/button/button";

import { styles } from "../sidebar/network.styles";

export const NetworkToolbar = () => {
  const { setNetworkSearchTerm, clearNetwork } = useDevtoolsContext("ToolbarNetwork");

  const css = styles.useStyles();

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setNetworkSearchTerm(e.target.value)} />
      <div className={css.spacer} />
      <Button color="gray" onClick={clearNetwork}>
        <ListXIcon />
        Clear network
      </Button>
    </Options>
  );
};
