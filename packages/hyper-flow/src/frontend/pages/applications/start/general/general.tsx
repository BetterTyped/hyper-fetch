import { CardTraffic } from "./card-traffic";
import { CardNetwork } from "./card-network";
import { CardRecent } from "./card-recent";
import { CardErrors } from "./card-errors";

export const GeneralDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <CardNetwork className="md:col-span-2" />
      <CardRecent className="md:col-span-3" />
      <CardTraffic className="md:col-span-2" />
      <CardErrors className="md:col-span-3" />
    </div>
  );
};
