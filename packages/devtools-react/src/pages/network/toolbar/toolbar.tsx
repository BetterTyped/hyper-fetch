import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { Select } from "components/select/select";
import { useDevtoolsContext } from "devtools.context";
import { Button } from "components/button/button";
import { ClearIcon } from "icons/clear";

import { styles } from "../network.styles";

export const Toolbar = () => {
  const { setNetworkSearchTerm, clearNetwork } = useDevtoolsContext("ToolbarNetwork");

  const css = styles.useStyles();

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setNetworkSearchTerm(e.target.value)} />
      <Select
        style={{ marginLeft: "6px" }}
        // eslint-disable-next-line no-console
        onChange={(e) => console.log(e.currentTarget.value)}
        options={[
          {
            value: "time",
            label: "Sort by time",
          },
          {
            value: "status",
            label: "Sort by status",
          },
        ]}
      />
      <div className={css.spacer} />
      <Button color="gray" onClick={clearNetwork}>
        <ClearIcon />
        Clear network
      </Button>
    </Options>
  );
};
