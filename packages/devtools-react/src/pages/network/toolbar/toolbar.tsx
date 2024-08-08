import { Chip } from "components/chip/chip";
import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { Select } from "components/select/select";
import { useDevtoolsContext } from "devtools.context";
import { Status } from "utils/request.status.utils";

import { styles } from "../network.styles";

export const Toolbar = () => {
  const { success, failed, inProgress, paused, canceled, networkFilter, setNetworkFilter } =
    useDevtoolsContext("ToolbarNetwork");

  const css = styles.useStyles();

  const getColor = <T extends string>(status: Status, color: T) => {
    if (!networkFilter) return color;
    return networkFilter === status ? color : "inactive";
  };

  const handleSetFilter = (status: Status) => {
    if (networkFilter === status) {
      setNetworkFilter(null);
    } else {
      setNetworkFilter(status);
    }
  };

  return (
    <Options>
      <Search placeholder="Search" />
      <Select
        style={{ marginLeft: "6px" }}
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
      <div className={css.toolbarRow}>
        <Chip onClick={() => handleSetFilter(Status.SUCCESS)} color={getColor(Status.SUCCESS, "green")}>
          Success {success.length}
        </Chip>
        <Chip onClick={() => handleSetFilter(Status.FAILED)} color={getColor(Status.FAILED, "red")}>
          Failed {failed.length}
        </Chip>
        <Chip onClick={() => handleSetFilter(Status.IN_PROGRESS)} color={getColor(Status.IN_PROGRESS, "blue")}>
          In Progress {inProgress.length}
        </Chip>
        <Chip onClick={() => handleSetFilter(Status.PAUSED)} color={getColor(Status.PAUSED, "gray")}>
          Paused {paused.length}
        </Chip>
        <Chip onClick={() => handleSetFilter(Status.CANCELED)} color={getColor(Status.CANCELED, "orange")}>
          Canceled {canceled.length}
        </Chip>
      </div>
    </Options>
  );
};
