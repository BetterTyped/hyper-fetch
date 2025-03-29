import { NetworkDetails } from "./details/network.details";
import { NetworkList } from "./list/network.list";

export const ProjectNetwork = () => {
  return (
    <div className="flex relative flex-1 h-full">
      <NetworkList />
      <NetworkDetails />
    </div>
  );
};
