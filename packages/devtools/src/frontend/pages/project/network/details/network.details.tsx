import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Braces, Clock, FileText, FileUp } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "frontend/components/ui/tabs";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { JSONViewer } from "frontend/components/json-viewer/json-viewer";
import { ResizableSidebar } from "frontend/components/ui/resizable-sidebar";
import { useNetworkStore } from "frontend/store/project/network.store";
import { SectionOverview } from "./section-overview";
import { SectionToolbar } from "./section-toolbar";
import { SectionHead } from "./section-head";
import { Card } from "frontend/components/ui/card";
import { EmptyState } from "frontend/components/ui/empty-state";

export const NetworkDetails = () => {
  const { project } = useDevtools();

  const { requests, detailsRequestId } = useNetworkStore(useShallow((state) => state.projects[project.name]));

  const item = useMemo(() => {
    if (!detailsRequestId) return null;
    return requests.find((request) => request.requestId === detailsRequestId);
  }, [detailsRequestId, requests]);

  const config = useMemo(() => {
    if (!item) return null;

    const values = JSON.parse(JSON.stringify(item.request));
    delete values.payload;
    delete values.params;
    delete values.queryParams;
    delete values.headers;

    return values;
  }, [item]);

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
      <div className="max-h-full overflow-hidden px-4 flex flex-col">
        <SectionToolbar item={item} />
        <SectionHead item={item} />
        <SectionOverview item={item} />

        <Tabs defaultValue="request" className="mt-4 flex-1 overflow-hidden">
          <TabsList>
            <TabsTrigger value="payload">
              <FileUp />
              Payload
            </TabsTrigger>
            <TabsTrigger value="response">
              <FileText />
              Response
            </TabsTrigger>
            <TabsTrigger value="details">
              <Clock />
              Processing Details
            </TabsTrigger>
            <TabsTrigger value="request">
              <Braces />
              Request Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payload" className="flex-1 overflow-auto">
            <Card className="p-4 bg-sidebar mb-4">
              <JSONViewer
                data={{
                  payload: item.request.payload,
                  params: item.request.params,
                  queryParams: item.request.queryParams,
                  headers: item.request.headers,
                }}
              />
            </Card>
          </TabsContent>

          <TabsContent value="response" className="flex-1 overflow-auto">
            {item.response && (
              <Card className="p-4 bg-sidebar mb-4">
                <JSONViewer data={item.response} />
              </Card>
            )}
            {!item.response && (
              <EmptyState
                title="No response"
                description="The request did not receive a response from the server yet"
              />
            )}
          </TabsContent>

          <TabsContent value="details" className="flex-1 overflow-auto">
            {item.details && (
              <Card className="p-4 bg-sidebar mb-4">
                <JSONViewer data={item.details} />
              </Card>
            )}
            {!item.details && (
              <EmptyState
                title="No processing details"
                description="The request did not receive a response from the server yet"
              />
            )}
          </TabsContent>

          <TabsContent value="request" className="flex-1 overflow-auto">
            <Card className="p-4 bg-sidebar mb-4">
              <JSONViewer data={config} sortObjectKeys />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResizableSidebar>
  );
};
