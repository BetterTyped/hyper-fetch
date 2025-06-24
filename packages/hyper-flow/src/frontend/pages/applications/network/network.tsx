import { NetworkDetails } from "./details/network.details";
import { NetworkList } from "./list/network.list";

export const ApplicationNetwork = () => {
  return (
    <div className="flex relative flex-1 h-full">
      <NetworkList />
      <NetworkDetails />
    </div>
  );
};
