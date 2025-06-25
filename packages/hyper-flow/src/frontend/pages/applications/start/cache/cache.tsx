import { CardMetrics } from "./card-metrics";
import { CardMostCached } from "./card-most-cached";
import { CardNotCached } from "./card-not-cached";

export const CacheDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="md:col-span-2 space-y-4">
        <CardMetrics className="h-full" />
      </div>
      <div className="md:col-span-3 flex flex-col gap-4">
        <CardMostCached className="flex-1" />
        <CardNotCached className="flex-1" />
      </div>
    </div>
  );
};
