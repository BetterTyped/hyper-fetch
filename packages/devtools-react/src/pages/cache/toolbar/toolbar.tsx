import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { Select } from "components/select/select";

export const Toolbar = () => {
  return (
    <Options>
      <Search placeholder="Search" />
      <Select
        options={[
          { value: "time", label: "Sort by time" },
          { value: "status", label: "Sort by status" },
        ]}
      />
    </Options>
  );
};
