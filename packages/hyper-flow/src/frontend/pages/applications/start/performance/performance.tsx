import { CardResponses } from "./card-responses";
import { CardEndpoints } from "./card-endpoints";
import { CardOverview } from "./card-overview";

export const PerformanceDashboard = () => {
  return (
    <div className="space-y-4 mt-4">
      <CardOverview />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
        <CardResponses className="md:col-span-2" />
        <CardEndpoints className="md:col-span-3" />
      </div>
    </div>
  );
};
