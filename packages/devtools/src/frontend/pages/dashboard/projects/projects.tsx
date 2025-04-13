import { useState, useEffect } from "react";
import { Info, Earth } from "lucide-react";

import { useLocation } from "frontend/routing/router";
import { Card } from "frontend/components/ui/card";
import { KpiCard3 } from "frontend/components/ui/kpi-card-3";
import { KpiCardFeed } from "frontend/components/ui/kpi-card-feed";
import { useProjects } from "frontend/store/project/projects.store";
import { ProjectCard } from "frontend/components/ui/project-card";

export const Projects = () => {
  const projects = useProjects((state) => state.projects);
  const { navigate } = useLocation();
  const messageCount = 0;
  const [pulseHistory, setPulseHistory] = useState<Array<{ value: number; date: Date }>>(
    Array(20)
      .fill(0)
      .map((_, index) => ({ value: 15, date: new Date(Date.now() - index * 1000) })),
  );

  // Simulate websocket connection and message reception
  useEffect(() => {
    let accumulatedMessages = 0;

    // Simulate receiving messages periodically
    const messageInterval = setInterval(() => {
      // Add new entry with accumulated messages over the last 3 seconds
      setPulseHistory((prev) => {
        const newEntry = { value: Math.min(accumulatedMessages + 15, 30), date: new Date() };
        // Remove oldest entry and add new one
        return [...prev.slice(1), newEntry];
      });

      // Reset accumulator and update last update time
      accumulatedMessages = 0;
    }, 3000);

    return () => {
      clearInterval(messageInterval);
    };
  }, []);

  const onOpenProject = (projectName: string) => {
    navigate({
      to: "project",
      params: {
        projectName,
      },
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard3 value="9" label="Online Projects" change="Live" positive />
        <KpiCardFeed
          value={messageCount}
          label="Requests"
          data={pulseHistory}
          name="value"
          icon={<Earth className="h-5 w-5 text-blue-500" />}
        />
        <KpiCard3 value="127" label="Saved Mocks" />
      </div>

      <h3 className="text-xl font-bold mb-4">Projects</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(projects).map((project) => (
          <ProjectCard key={project.name} iconUrl="" {...project} onOpen={() => onOpenProject(project.name)} />
        ))}
        <Card
          className="w-full max-w-sm hover:shadow-md transition-shadow duration-300 flex items-center justify-center cursor-pointer border-dashed"
          // onClick={() => setShowNewWorkspaceDialog(true)}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-12 w-12 rounded-full bg-gray-400/20 flex items-center justify-center mb-2">
              <Info className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500">Cannot see your project?</p>
            <p className="text-sm text-gray-500">Learn how to connect your project</p>
          </div>
        </Card>
      </div>
    </>
  );
};
