import { useMemo, useState } from "react";
import { Braces, Clock, FileText, FileUp, ChevronDown } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JSONViewer } from "@/components/json-viewer/json-viewer";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/no-content/empty-state";
import { DevtoolsRequestEvent } from "@/context/applications/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const SectionData = ({ item }: { item: DevtoolsRequestEvent }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("payload");

  const config = useMemo(() => {
    if (!item) return null;

    const values = JSON.parse(JSON.stringify(item.request));
    delete values.payload;
    delete values.params;
    delete values.queryParams;
    delete values.headers;

    return values;
  }, [item]);

  const hasContent = (value: string) => {
    switch (value) {
      case "response":
        return !!item.response;
      case "details":
        return !!item.details;
      case "payload":
      case "request":
        return true;
      default:
        return false;
    }
  };

  return (
    <Tabs defaultValue="payload" className="h-[600px] my-4 flex-1" onValueChange={setActiveTab}>
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

      <div className="relative">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            !isOpen && hasContent(activeTab) && "max-h-[200px]",
          )}
        >
          <TabsContent value="payload" className="h-full">
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

          <TabsContent value="response" className="h-full">
            {item.response ? (
              <Card className="p-4 bg-sidebar mb-4 h-full overflow-auto">
                <JSONViewer data={item.response} />
              </Card>
            ) : (
              <EmptyState
                title="No response"
                description="The request did not receive a response from the server yet"
              />
            )}
          </TabsContent>

          <TabsContent value="details" className="h-full">
            {item.details ? (
              <Card className="p-4 bg-sidebar mb-4 h-full overflow-auto">
                <JSONViewer data={item.details} />
              </Card>
            ) : (
              <EmptyState
                title="No processing details"
                description="The request did not receive a response from the server yet"
              />
            )}
          </TabsContent>

          <TabsContent value="request" className="h-full">
            <Card className="p-4 bg-sidebar mb-4 h-full overflow-auto">
              <JSONViewer data={config} sortObjectKeys />
            </Card>
          </TabsContent>
        </div>

        {hasContent(activeTab) && (
          <>
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-24 pointer-events-none",
                !isOpen && "bg-gradient-to-t from-card to-transparent",
                !isOpen && "h-32",
              )}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10",
                isOpen ? "bottom-1" : "bottom-4",
              )}
            >
              {isOpen ? "Show Less" : "Show More"}
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
            </Button>
          </>
        )}
      </div>
    </Tabs>
  );
};
