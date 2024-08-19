import { useDevtoolsContext } from "../../devtools.context";
import { Options } from "../../components/options/options";
import { Search } from "../../components/search/search";

import { styles } from "../network/network.styles";

export const Toolbar = () => {
  const { setVisualizerSearchTerm } = useDevtoolsContext("ToolbarVisualizer");

  const css = styles.useStyles();

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setVisualizerSearchTerm(e.target.value)} />
      <div className={css.spacer} />
    </Options>
  );
};
