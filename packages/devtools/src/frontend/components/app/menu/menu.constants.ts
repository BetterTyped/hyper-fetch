import {
  // BriefcaseBusinessIcon,
  CpuIcon,
  DatabaseBackupIcon,
  LucideProps,
  NetworkIcon,
  // SquareChartGanttIcon,
} from "lucide-react";

import { DevtoolsModule } from "frontend/pages/project/_context/devtools.types";

export const menuIcons: Partial<
  Record<DevtoolsModule, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>>
> = {
  // [DevtoolsModule.WORKSPACE]: BriefcaseBusinessIcon,
  [DevtoolsModule.NETWORK]: NetworkIcon,
  [DevtoolsModule.CACHE]: DatabaseBackupIcon,
  [DevtoolsModule.QUEUES]: CpuIcon,
  // [DevtoolsModule.EXPLORER]: SquareChartGanttIcon,
};
