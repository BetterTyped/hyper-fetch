import { useShallow } from "zustand/react/shallow";

import { SectionHead } from "./section-head";
import { SectionToolbar } from "./section-toolbar";
import { SectionOverview } from "./section-overview";
import { SectionData } from "./section-data";

import { useQueueStore } from "@/store/applications/queue.store";
import { ResizableSidebar } from "@/components/ui/resizable-sidebar";
import { useDevtools } from "@/context/applications/devtools/use-devtools";

export const QueuesDetails = () => {
  const { application } = useDevtools();
  const { queues, detailsId } = useQueueStore(useShallow((state) => state.applications[application.name]));

  const item = detailsId ? queues.get(detailsId) : null;

  if (!item) return null;

  return (
    <ResizableSidebar
      position="right"
      className="absolute flex flex-col top-0 right-0 bottom-0 border-l border-light-400 dark:border-dark-400"
      defaultSize={{
        width: "70%",
      }}
      minWidth="500px"
      maxWidth="100%"
      minHeight="100%"
      maxHeight="100%"
    >
      <div className="max-h-full flex flex-col">
        <div className="px-4">
          <SectionToolbar item={item} />
          <SectionHead item={item} />
        </div>
        <div className="px-4 flex-1 overflow-y-auto">
          <SectionOverview item={item} />
          <SectionData item={item} />
        </div>
      </div>
    </ResizableSidebar>
  );
};
