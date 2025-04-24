import { CardTraffic } from "./card-traffic";
import { CardNetwork } from "./card-network";
import { CardRecent } from "./card-recent";
import { CardPatterns } from "./card-patterns";

export const GeneralDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <CardNetwork className="md:col-span-2" />
      <CardRecent className="md:col-span-3" />
      <CardTraffic className="md:col-span-2" />
      <CardPatterns className="md:col-span-3" />
    </div>
  );
};
