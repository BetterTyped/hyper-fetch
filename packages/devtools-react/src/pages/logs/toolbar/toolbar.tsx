import { Button } from "components/button/button";
import { Options } from "components/options/options";
import { Search } from "components/search/search";

export const Toolbar = () => {
  return (
    <Options>
      <Search placeholder="Search" />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          marginLeft: "10px",
        }}
      >
        <Button color="primary">All</Button>
        <Button color="secondary">Info</Button>
        <Button color="warning">Warnings</Button>
        <Button color="error">Errors</Button>
        <Button color="tertiary">Verbose</Button>
      </div>
    </Options>
  );
};
