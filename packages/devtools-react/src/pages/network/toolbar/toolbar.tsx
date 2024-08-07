import { Chip } from "components/chip/chip";
import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { Select } from "components/select/select";
import { useDevtoolsContext } from "devtools.context";
import { Status } from "utils/request.status.utils";
import { useNetworkContext } from "../network.context";

export const Toolbar = () => {
  const { success, failed, inProgress, paused, canceled } = useDevtoolsContext("ToolbarNetwork");
  const { filter, setFilter } = useNetworkContext("ToolbarNetwork");

  const getColor = <T extends string>(status: Status, color: T) => {
    if (!filter) return color;
    return filter === status ? color : "inactive";
  };

  const handleSetFilter = (status: Status) => {
    if (filter === status) {
      setFilter(null);
    } else {
      setFilter(status);
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
      {/* <button>clear list</button> */}

      <div style={{ flex: "1 1 auto" }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
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
      </div>
    </Options>
  );
};
