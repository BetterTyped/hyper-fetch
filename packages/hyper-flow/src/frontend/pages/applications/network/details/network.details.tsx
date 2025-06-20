import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { ResizableSidebar } from "@/components/ui/resizable-sidebar";
import { useNetworkStore } from "@/store/applications/network.store";
import { SectionOverview } from "./section-overview";
import { SectionToolbar } from "./section-toolbar";
import { SectionHead } from "./section-head";
import { SectionData } from "./section-data";

export const NetworkDetails = () => {
  const { application } = useDevtools();

  const { requests, detailsRequestId } = useNetworkStore(useShallow((state) => state.applications[application.name]));

  const item = useMemo(() => {
    if (!detailsRequestId) return null;
    return requests.find((request) => request.requestId === detailsRequestId);
  }, [detailsRequestId, requests]);

  // It is never shown to the user
  if (!item) return null;

  return (
    <ResizableSidebar
      position="right"
      defaultSize={{
        width: "70%",
      }}
      minWidth="540px"
      maxWidth="100%"
      minHeight="100%"
      maxHeight="100%"
    >
      <div className="max-h-full flex flex-col">
        <div className="px-4">
          <SectionToolbar item={item} />
          <SectionHead item={item} />
        </div>
        <div className="px-4 overflow-auto">
          <SectionOverview item={item} />
          <SectionData item={item} />
        </div>
      </div>
    </ResizableSidebar>
  );
};
