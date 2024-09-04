import { CpuIcon, DatabaseBackupIcon, NetworkIcon, SquareChartGanttIcon } from "lucide-react";

import { DevtoolsModule } from "../../../devtools.types";

export const menuIcons = {
  [DevtoolsModule.NETWORK]: NetworkIcon,
  [DevtoolsModule.CACHE]: DatabaseBackupIcon,
  [DevtoolsModule.QUEUES]: CpuIcon,
  [DevtoolsModule.EXPLORER]: SquareChartGanttIcon,
};
