import { Database } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { EmptyTable } from "@/components/no-content/empty-table";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { cn } from "@/lib/utils";
import type { ApplicationDbs, DbInspection } from "@/store/applications/db.store";
import { useDbStore } from "@/store/applications/db.store";

const emptyDbs: ApplicationDbs = { dbs: {}, selectedDbId: null, selectedCollection: null };

const statusColors = { ready: "green", loading: "blue", error: "red" } as const;

const describeCondition = (node: unknown) => JSON.stringify(node);

const Collections = ({
  application,
  inspection,
  selected,
}: {
  application: string;
  inspection: DbInspection;
  selected: string | null;
}) => {
  const selectCollection = useDbStore((state) => state.selectCollection);
  return (
    <Table aria-label="Collections">
      <TableHeader>
        <TableRow>
          <TableHead>Collection</TableHead>
          <TableHead>Rows</TableHead>
          <TableHead>Subsets</TableHead>
          <TableHead>Pending writes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspection.collections.map((collection) => (
          <TableRow
            key={collection.name}
            data-testid="db-collection"
            className={cn("cursor-pointer", selected === collection.name && "bg-accent")}
            onClick={() => selectCollection(application, selected === collection.name ? null : collection.name)}
          >
            <TableCell>{collection.name}</TableCell>
            <TableCell>{collection.rows}</TableCell>
            <TableCell>{collection.subsets.length}</TableCell>
            <TableCell>{collection.layers.length}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const Subsets = ({ collection }: { collection: DbInspection["collections"][number] }) => (
  <Table aria-label={`Subsets of ${collection.name}`}>
    <TableHeader>
      <TableRow>
        <TableHead>Subset</TableHead>
        <TableHead>Loader</TableHead>
        <TableHead>Rows</TableHead>
        <TableHead>State</TableHead>
        <TableHead>Queries</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {collection.subsets.map((subset) => (
        <TableRow key={`${subset.kind}:${subset.id}`} data-testid="db-subset">
          <TableCell className="max-w-[320px] truncate">
            {subset.kind === "key" ? `key ${subset.id}` : subset.id}
          </TableCell>
          <TableCell>{subset.loader}</TableCell>
          <TableCell>{subset.rows}</TableCell>
          <TableCell>
            {[
              subset.loading && "loading",
              subset.live && "live",
              subset.fresh ? "fresh" : "stale",
              Boolean(subset.error) && "error",
            ]
              .filter(Boolean)
              .join(", ")}
          </TableCell>
          <TableCell>{subset.observers}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const Queries = ({ inspection }: { inspection: DbInspection }) => (
  <Table aria-label="Live queries">
    <TableHeader>
      <TableRow>
        <TableHead>Collection</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Rows</TableHead>
        <TableHead>Plan</TableHead>
        <TableHead>Sent</TableHead>
        <TableHead>Local</TableHead>
        <TableHead>Syncs</TableHead>
        <TableHead>Subscribers</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {inspection.queries.map((query) => (
        <TableRow key={query.key} data-testid="db-query">
          <TableCell>{query.collection}</TableCell>
          <TableCell>
            <Chip color={statusColors[query.status]}>{query.status}</Chip>
          </TableCell>
          <TableCell>{query.rows ?? "-"}</TableCell>
          <TableCell>
            {query.plan.answeredLocally ? "answered locally" : query.plan.kind}
            {query.plan.loader !== undefined && ` · loader ${query.plan.loader}`}
          </TableCell>
          <TableCell className="max-w-[240px] truncate">
            {query.plan.sent.map(describeCondition).join(" and ")}
          </TableCell>
          <TableCell className="max-w-[240px] truncate">
            {query.plan.local.map(describeCondition).join(" and ")}
          </TableCell>
          <TableCell>{query.plan.syncs.map((sync) => `${sync.type} ${sync.topic}`).join(", ")}</TableCell>
          <TableCell>{query.subscribers}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const Outbox = ({ inspection }: { inspection: DbInspection }) =>
  inspection.outbox.length === 0 ? (
    <p className="text-sm text-muted-foreground">The outbox is empty.</p>
  ) : (
    <Table aria-label="Outbox">
      <TableHeader>
        <TableRow>
          <TableHead>Write</TableHead>
          <TableHead>Collection</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Sent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspection.outbox.map((entry) => (
          <TableRow key={entry.id} data-testid="db-outbox-entry">
            <TableCell>{entry.op}</TableCell>
            <TableCell>{entry.collection}</TableCell>
            <TableCell>{String(entry.key)}</TableCell>
            <TableCell>{entry.sent ? "yes" : "no"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

/** The collections, loaded subsets, live queries with their plans, optimistic layers and outbox of an app's dbs */
export const ApplicationDb = () => {
  const {
    application: { name },
  } = useDevtools();
  const { dbs, selectedDbId, selectedCollection } = useDbStore(
    useShallow((state) => state.applications[name] ?? emptyDbs),
  );
  const selectDb = useDbStore((state) => state.selectDb);
  const dbList = Object.values(dbs);
  const current = selectedDbId ? dbs[selectedDbId] : undefined;
  const collection = current?.inspection.collections.find((item) => item.name === selectedCollection);

  return (
    <Section id="db" className="flex h-full w-full flex-1 flex-col gap-4 overflow-auto px-4">
      <SectionHeader sticky>
        <SectionIcon>
          <Database />
        </SectionIcon>
        <SectionTitle>DB</SectionTitle>
        <SectionDescription>
          Collections, live queries and pending writes of the dbs your application inspects.
        </SectionDescription>
      </SectionHeader>

      {!current && (
        <EmptyTable
          title="No dbs inspected"
          description="Pass your db to the devtools plugin: DevtoolsPlugin({ appName, dbs: [db] })"
        />
      )}

      {current && (
        <>
          {dbList.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Dbs">
              {dbList.map((db) => (
                <Button
                  key={db.id}
                  variant="ghost"
                  aria-pressed={db.id === current.id}
                  className={cn(db.id === current.id && "bg-accent")}
                  onClick={() => selectDb(name, db.id)}
                >
                  {db.id}
                </Button>
              ))}
            </div>
          )}
          <Collections application={name} inspection={current.inspection} selected={selectedCollection} />
          {collection && <Subsets collection={collection} />}
          <h3 className="text-sm font-medium">Live queries</h3>
          {current.inspection.queries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No live queries.</p>
          ) : (
            <Queries inspection={current.inspection} />
          )}
          <h3 className="text-sm font-medium">Outbox</h3>
          <Outbox inspection={current.inspection} />
        </>
      )}
    </Section>
  );
};
