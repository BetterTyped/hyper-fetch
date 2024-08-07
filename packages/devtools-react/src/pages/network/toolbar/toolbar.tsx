import { Chip } from "components/chip/chip";
import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { Select } from "components/select/select";
import { useDevtoolsContext } from "devtools.context";

export const Toolbar = () => {
  const { success, failed, inProgress, paused, canceled } = useDevtoolsContext("ToolbarNetwork");

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
          <Chip color="green">Success {success.length}</Chip>
          <Chip color="red">Failed {failed.length}</Chip>
          <Chip color="blue">In Progress {inProgress.length}</Chip>
          <Chip color="gray">Paused {paused.length}</Chip>
          <Chip color="orange">Canceled {canceled.length}</Chip>
        </div>
      </div>
    </Options>
  );
};
