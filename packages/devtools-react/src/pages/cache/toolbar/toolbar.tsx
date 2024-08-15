import { Options } from "components/options/options";
import { Search } from "components/search/search";
import { Select } from "components/select/select";
import { useDevtoolsContext } from "devtools.context";

export const Toolbar = () => {
  const { setCacheSearchTerm } = useDevtoolsContext("DevtoolsCacheToolbar");

  return (
    <Options>
      <Search placeholder="Search" onChange={(e) => setCacheSearchTerm(e.target.value)} />
      <Select
        options={[
          { value: "time", label: "Sort by time" },
          { value: "status", label: "Sort by status" },
        ]}
      />
      {/* Options: Show active - only with emitter observers (hooks) */}
    </Options>
  );
};
