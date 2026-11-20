import { Atom } from "lucide-react";
import { matchSorter } from "match-sorter";
/* eslint-disable react/no-array-index-key */
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { QueuesToolbar } from "../toolbar/queues.toolbar";
import { Item } from "./queue-item/queue-item";
import { EmptyTable } from "@/components/no-content/empty-table";
import { DocsButton } from "@/components/ui/docs-button";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { useQueueStore } from "@/store/applications/queue.store";

export const QueuesList = () => {
  const { application } = useDevtools();
  const { queues, searchTerm } = useQueueStore(useShallow((state) => state.applications[application.name]));

  // Filtered in render: the debounced `useSearch` kept a stale copy of the list and hid or froze queues that
  // changed within its delay (and right after mounting in StrictMode)
  const items = useMemo(() => {
    const data = [...queues.values()];
    if (!searchTerm) {
      return data;
    }
    return matchSorter(data, searchTerm, { keys: ["queryKey"] });
  }, [queues, searchTerm]);

  return (
    <Section id="queues" className="flex flex-col px-4 w-full h-full flex-1 overflow-auto">
      <SectionHeader>
        <SectionIcon>
          <Atom />
        </SectionIcon>
        <SectionTitle>Queues</SectionTitle>
        <SectionDescription>You can see here all active requests queues within your application.</SectionDescription>
      </SectionHeader>
      {queues.size > 0 && <QueuesToolbar />}
      <div className="w-full flex-1 overflow-y-auto max-h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items?.map((queue) => {
            return <Item key={queue.queryKey} queue={queue} />;
          })}
        </div>
        {queues.size > 0 && items.length === 0 && (
          <EmptyTable title="No matching queues" description={`No queue matches "${searchTerm}".`} />
        )}
        {queues.size === 0 && (
          <EmptyTable title="No active queues" description="Make some request to see all active queues here.">
            <DocsButton />
          </EmptyTable>
        )}
      </div>
    </Section>
  );
};
