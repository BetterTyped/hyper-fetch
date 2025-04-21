import { Badge } from "frontend/components/ui/badge";
import { Method } from "frontend/components/ui/method";
import { DevtoolsRequestEvent } from "frontend/context/projects/types";

export const SectionHead = ({ item }: { item: DevtoolsRequestEvent }) => {
  return (
    <div className="flex flex-row items-baseline gap-3 my-3 px-2">
      <Method method={item.request.method} className="text-2xl" />
      <div className="font-medium text-3xl flex-1">{item.request.endpoint}</div>
      <div>
        {!!item.details?.retries && <Badge variant="secondary">Retried Request ({item.details.retries})</Badge>}
        {item.request.isMockerEnabled && !!item.request.hasMock && <Badge variant="secondary">Mocked</Badge>}
      </div>
    </div>
  );
};
