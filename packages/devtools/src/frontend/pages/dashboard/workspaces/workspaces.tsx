import { useState, useEffect } from "react";
import { PlusIcon, ActivityIcon } from "lucide-react";

import { useLocation } from "frontend/routing/router";
import { useWorkspaces } from "frontend/store/workspace/workspaces.store";
import { WorkspaceCard } from "frontend/components/ui/workspace-card";
import { Card } from "frontend/components/ui/card";
import { AddWorkspaceDialog } from "./add-workspace/add-workspace-dialog";
import { KpiCard3 } from "frontend/components/ui/kpi-card-3";
import { KpiCardFeed } from "frontend/components/ui/kpi-card-feed";

export const Workspaces = () => {
  const workspaces = useWorkspaces((state) => state.workspaces);
  const { navigate } = useLocation();
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [pulseHistory, setPulseHistory] = useState<Array<{ value: number; date: Date }>>(
    Array(20)
      .fill(0)
      .map(() => ({ value: 15, date: new Date() })),
  );

  // Simulate websocket connection and message reception
  useEffect(() => {
    let accumulatedMessages = 0;
    let lastUpdateTime = new Date();

    // Simulate receiving messages periodically
    const messageInterval = setInterval(() => {
      const now = new Date();
      const newMessages = Math.floor(Math.random() * 3);

      if (newMessages > 0) {
        setMessageCount((prev) => prev + newMessages);
        accumulatedMessages += newMessages;
      }

      // Check if 3 seconds have passed since last update
      const timeDiff = now.getTime() - lastUpdateTime.getTime();
      if (timeDiff >= 3000) {
        // Add new entry with accumulated messages over the last 3 seconds
        setPulseHistory((prev) => {
          const newEntry = { value: Math.min(accumulatedMessages + 15, 30), date: new Date() };
          // Remove oldest entry and add new one
          return [...prev.slice(1), newEntry];
        });

        // Reset accumulator and update last update time
        accumulatedMessages = 0;
        lastUpdateTime = now;
      }
    }, 1000);

    return () => clearInterval(messageInterval);
  }, []);

  const onOpenProject = (workspaceId: string) => {
    navigate({
      to: "workspace",
      params: {
        workspaceId,
      },
    });
  };

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard3 value="9" label="Online Projects" change="Live" positive />
        <KpiCardFeed
          value={messageCount}
          label="Requests"
          subtitle="Reads from active projects"
          data={pulseHistory}
          name="value"
          icon={<ActivityIcon className="h-3.5 w-3.5 text-blue-500" />}
        />
        <KpiCard3 value="127" label="Saved Mocks" />
      </div>

      <h1 className="text-2xl font-bold mb-4">Workspaces</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            {...workspace}
            iconUrl=""
            isConnectedToCloud={false}
            onOpen={() => onOpenProject(workspace.id)}
          />
        ))}
        <Card
          className="w-full max-w-sm hover:shadow-md transition-shadow duration-300 flex items-center justify-center cursor-pointer border-dashed"
          onClick={() => setShowNewWorkspaceDialog(true)}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <PlusIcon className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500">Add New Workspace</p>
          </div>
        </Card>
      </div>
      <AddWorkspaceDialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog} />
    </>
  );
};
