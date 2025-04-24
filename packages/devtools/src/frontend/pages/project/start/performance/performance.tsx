import { CardResponses } from "./card-responses";
import { CardEndpoints } from "./card-endpoints";

export const PerformanceDashboard = () => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
      <CardResponses className="md:col-span-2" />
      <CardEndpoints className="md:col-span-3" />
    </div>
  );
};
