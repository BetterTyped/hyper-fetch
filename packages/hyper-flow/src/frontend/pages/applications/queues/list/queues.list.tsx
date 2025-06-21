/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Atom } from "lucide-react";

import { Item } from "./queue-item/queue-item";

import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useSearch } from "@/hooks/use-search";
import { useQueueStore } from "@/store/applications/queue.store";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";
import { EmptyTable } from "@/components/no-content/empty-table";
import { DocsButton } from "@/components/ui/docs-button";

export const QueuesList = () => {
  const { application } = useDevtools();
  const { queues, searchTerm } = useQueueStore(useShallow((state) => state.applications[application.name]));

  const data = useMemo(() => {
    return Array.from(queues.values());
  }, [queues]);

  const { items } = useSearch({
    data,
    searchKeys: ["queryKey"],
    searchTerm,
  });

  return (
    <Section id="queues" className="flex flex-col px-4 w-full h-full flex-1 overflow-auto">
      <SectionHeader>
        <SectionIcon>
          <Atom />
        </SectionIcon>
        <SectionTitle>Queues</SectionTitle>
        <SectionDescription>You can see here all active requests queues within your application.</SectionDescription>
      </SectionHeader>
      <div className="w-full flex-1 overflow-y-auto max-h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items?.map((queue, index) => {
            return <Item key={index} queue={queue} />;
          })}
        </div>
        {!items.length && (
          <EmptyTable title="No active queues" description="Make some request to see all active queues here.">
            <DocsButton />
          </EmptyTable>
        )}
      </div>
    </Section>
  );
};
