/* eslint-disable react/no-array-index-key */
import { useShallow } from "zustand/react/shallow";
import { Atom } from "lucide-react";

import { useDevtools } from "frontend/context/projects/devtools/use-devtools";
import { useSearch } from "frontend/hooks/use-search";
import { useQueueStore } from "frontend/store/project/queue.store";
import { EmptyState } from "frontend/components/ui/empty-state";
import { Card } from "./card/card";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "frontend/components/ui/section";

export const QueuesList = () => {
  const { project } = useDevtools();
  const { queues, searchTerm } = useQueueStore(useShallow((state) => state.projects[project.name]));

  const { items } = useSearch({
    data: Array.from(queues.values()),
    searchKeys: ["queryKey"],
    searchTerm,
  });

  return (
    <Section id="queues" className="flex flex-col w-full h-full flex-1">
      <SectionHeader>
        <SectionIcon>
          <Atom />
        </SectionIcon>
        <SectionTitle>Queues</SectionTitle>
        <SectionDescription>You can see here all active requests queues within your project.</SectionDescription>
      </SectionHeader>
      <div className="w-full flex-1 overflow-y-auto max-h-full">
        <div className="flex flex-row flex-wrap gap-2.5">
          {items?.map((queue, index) => {
            return <Card key={index} queue={queue} />;
          })}
        </div>
        {!items.length && (
          <EmptyState
            title="No active queues"
            description="Make some request to see their queues here!"
            className="max-h-148"
          />
        )}
      </div>
    </Section>
  );
};
