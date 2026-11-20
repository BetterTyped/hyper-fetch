import { ArrowDownLeft, ArrowUpRight, ListXIcon, Plug, Radio, TriangleAlert, XIcon } from "lucide-react";
import { matchSorter } from "match-sorter";
import { memo, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { JSONViewer } from "@/components/json-viewer/json-viewer";
import { EmptyTable } from "@/components/no-content/empty-table";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { ResizableSidebar } from "@/components/ui/resizable-sidebar";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDevtools } from "@/context/applications/devtools/use-devtools";
import { cn } from "@/lib/utils";
import type { InspectedSocket, SocketMessage, SocketsFilter } from "@/store/applications/sockets.store";
import { useSocketsStore } from "@/store/applications/sockets.store";
import { formatBytes } from "@/utils/format";

const statusColors = {
  connected: "green",
  connecting: "blue",
  reconnecting: "orange",
  disconnected: "gray",
  failed: "red",
} as const;

const filters: { label: string; value: SocketsFilter }[] = [
  { label: "All", value: "all" },
  { label: "Received", value: "received" },
  { label: "Sent", value: "sent" },
  { label: "Connection", value: "connection" },
];

const eventLabels: Record<string, string> = {
  SOCKET_CONNECTING: "Connecting",
  SOCKET_CONNECTED: "Connected",
  SOCKET_DISCONNECTED: "Disconnected",
  SOCKET_RECONNECTING: "Reconnecting",
  SOCKET_RECONNECT_FAILED: "Reconnecting failed",
  SOCKET_ERROR: "Error",
  SOCKET_MESSAGE_FAILED: "Sending failed",
};

const formatClock = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(undefined, {
    hour12: false,
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);

const getPreview = (message: SocketMessage) => {
  if (message.kind === "connection") {
    return message.attempts
      ? `${eventLabels[message.event]} (attempt ${message.attempts})`
      : eventLabels[message.event];
  }
  if (message.kind === "error" || message.kind === "failed") {
    const error = message.error as { message?: string } | undefined;
    return error?.message ?? eventLabels[message.event];
  }
  try {
    const text = typeof message.data === "string" ? message.data : JSON.stringify(message.data);
    return text && text.length > 120 ? `${text.slice(0, 120)}…` : (text ?? "");
  } catch {
    return String(message.data);
  }
};

const matchesFilter = (message: SocketMessage, filter: SocketsFilter) => {
  if (filter === "all") {
    return true;
  }
  if (filter === "connection") {
    return message.kind === "connection" || message.kind === "error";
  }
  if (filter === "sent") {
    return message.kind === "sent" || message.kind === "failed";
  }
  return message.kind === filter;
};

const DirectionIcon = ({ kind }: { kind: SocketMessage["kind"] }) => {
  switch (kind) {
    case "received":
      return <ArrowDownLeft aria-label="Received" className="size-4 text-green-500" />;
    case "sent":
      return <ArrowUpRight aria-label="Sent" className="size-4 text-blue-400" />;
    case "failed":
    case "error":
      return <TriangleAlert aria-label="Error" className="size-4 text-red-400" />;
    default:
      return <Plug aria-label="Connection" className="size-4 text-zinc-400" />;
  }
};

const SocketCard = memo(
  ({ socket, selected, onSelect }: { socket: InspectedSocket; selected: boolean; onSelect: () => void }) => {
    const topics = Object.keys(socket.topics).length;
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        data-testid={`socket-card-${socket.id}`}
        className={cn(
          "flex min-w-[260px] flex-1 flex-col gap-2 rounded-xl border bg-zinc-900/40 p-3 text-left transition hover:bg-zinc-800/50",
          selected ? "border-blue-400/60 ring-1 ring-blue-400/40" : "border-zinc-800",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium" title={socket.url}>
            {socket.url}
          </span>
          <Chip color={statusColors[socket.status]}>{socket.status}</Chip>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{socket.adapterName}</span>
          <span>
            ↓ {socket.received} · {formatBytes(socket.bytesReceived)}
          </span>
          <span>
            ↑ {socket.sent} · {formatBytes(socket.bytesSent)}
          </span>
          {!!socket.errors && <span className="text-red-400">{socket.errors} errors</span>}
          {!!socket.failed && <span className="text-red-400">{socket.failed} failed sends</span>}
          {!!socket.reconnectAttempts && <span>{socket.reconnectAttempts} reconnect attempts</span>}
          <span>{topics} topics</span>
        </div>
      </button>
    );
  },
);

const MessageRow = memo(
  ({ message, selected, onOpen }: { message: SocketMessage; selected: boolean; onOpen: () => void }) => (
    <TableRow
      onClick={onOpen}
      data-testid="socket-message"
      className={cn("cursor-pointer", selected && "ring-1 ring-inset ring-blue-400")}
    >
      <TableCell className="w-8">
        <DirectionIcon kind={message.kind} />
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
        {formatClock(message.timestamp)}
      </TableCell>
      <TableCell className="text-sm font-medium">{message.topic ?? "-"}</TableCell>
      <TableCell className="max-w-[420px] truncate font-mono text-xs">{getPreview(message)}</TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {message.size ? formatBytes(message.size) : "-"}
      </TableCell>
    </TableRow>
  ),
);

const MessageDetails = ({ application, message }: { application: string; message: SocketMessage }) => {
  const closeDetails = useSocketsStore((state) => state.closeDetails);
  return (
    <ResizableSidebar position="right" defaultSize={{ width: "45%" }} minWidth="360px" maxWidth="100%">
      <div className="flex max-h-full flex-col gap-3 overflow-auto px-4 py-2" data-testid="socket-message-details">
        <div className="flex items-center gap-2 border-b border-sidebar-border pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Close"
            onClick={() => closeDetails(application)}
          >
            <XIcon className="size-4" />
          </Button>
          <DirectionIcon kind={message.kind} />
          <span className="font-medium">{message.topic ?? eventLabels[message.event] ?? message.kind}</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{formatClock(message.timestamp)}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{message.socketId}</span>
          {!!message.size && <span>{formatBytes(message.size)}</span>}
        </div>
        {message.data !== undefined && (
          <section aria-label="Message data">
            <h4 className="mb-1 text-sm font-medium">{message.kind === "received" ? "Data" : "Payload"}</h4>
            <JSONViewer
              data={typeof message.data === "object" && message.data !== null ? message.data : { value: message.data }}
            />
          </section>
        )}
        {message.extra !== undefined && message.extra !== null && (
          <section aria-label="Message extra">
            <h4 className="mb-1 text-sm font-medium">Extra</h4>
            <JSONViewer data={message.extra} />
          </section>
        )}
        {message.error !== undefined && message.error !== null && (
          <section aria-label="Message error">
            <h4 className="mb-1 text-sm font-medium">Error</h4>
            <JSONViewer data={message.error} />
          </section>
        )}
      </div>
    </ResizableSidebar>
  );
};

/** Every socket the application inspects, and what went over them */
export const ApplicationSockets = () => {
  const { application } = useDevtools();
  const name = application.name;
  const { sockets, messages, selectedSocketId, detailsMessageId, searchTerm, filter } = useSocketsStore(
    useShallow((state) => {
      const app = state.applications[name];
      return {
        sockets: app?.sockets,
        messages: app?.messages,
        selectedSocketId: app?.selectedSocketId ?? null,
        detailsMessageId: app?.detailsMessageId ?? null,
        searchTerm: app?.searchTerm ?? "",
        filter: app?.filter ?? "all",
      };
    }),
  );
  const { selectSocket, openDetails, setSearchTerm, setFilter, clearMessages } = useSocketsStore(
    useShallow((state) => ({
      selectSocket: state.selectSocket,
      openDetails: state.openDetails,
      setSearchTerm: state.setSearchTerm,
      setFilter: state.setFilter,
      clearMessages: state.clearMessages,
    })),
  );

  const socketList = useMemo(() => Object.values(sockets ?? {}), [sockets]);

  const visible = useMemo(() => {
    const filtered = (messages ?? []).filter(
      (message) => (!selectedSocketId || message.socketId === selectedSocketId) && matchesFilter(message, filter),
    );
    if (!searchTerm) {
      return filtered;
    }
    return matchSorter(filtered, searchTerm, {
      keys: ["topic", (message) => getPreview(message)],
      // Keep the log in time order, a search narrows it rather than ranking it
      baseSort: (a, b) => b.item.id - a.item.id,
      threshold: matchSorter.rankings.CONTAINS,
    }).toSorted((a, b) => b.id - a.id);
  }, [messages, selectedSocketId, filter, searchTerm]);

  const details = useMemo(
    () => (detailsMessageId ? (messages ?? []).find((message) => message.id === detailsMessageId) : undefined),
    [messages, detailsMessageId],
  );

  return (
    <div className="relative flex h-full flex-1">
      <Section id="sockets" className="flex h-full w-full flex-1 flex-col overflow-auto px-4">
        <SectionHeader sticky>
          <SectionIcon>
            <Radio />
          </SectionIcon>
          <SectionTitle>Sockets</SectionTitle>
          <SectionDescription>
            Connections, messages and errors of the sockets your application inspects.
          </SectionDescription>
        </SectionHeader>

        {socketList.length === 0 && (
          <EmptyTable
            title="No sockets inspected"
            description="Pass your sockets to the devtools plugin: DevtoolsPlugin({ appName, sockets: [socket] })"
          />
        )}

        {socketList.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 pb-3" role="group" aria-label="Sockets">
              {socketList.length > 1 && (
                <Button
                  variant="ghost"
                  aria-pressed={!selectedSocketId}
                  className={cn("h-auto", !selectedSocketId && "bg-accent")}
                  onClick={() => selectSocket(name, null)}
                >
                  All sockets
                </Button>
              )}
              {socketList.map((socket) => (
                <SocketCard
                  key={socket.id}
                  socket={socket}
                  selected={selectedSocketId === socket.id}
                  onSelect={() => selectSocket(name, selectedSocketId === socket.id ? null : socket.id)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 pb-3">
              <div className="flex items-center gap-2">
                <Input
                  type="search"
                  aria-label="Search messages"
                  placeholder="Search by topic or content"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(name, event.target.value)}
                />
                <Button variant="secondary" onClick={() => clearMessages(name)}>
                  <ListXIcon />
                  Clear messages
                </Button>
              </div>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filter messages">
                {filters.map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant="ghost"
                    aria-pressed={filter === item.value}
                    className={cn("h-7 px-2 text-xs", filter === item.value && "bg-accent text-accent-foreground")}
                    onClick={() => setFilter(name, item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <EmptyTable
                title={messages?.length ? "No matching messages" : "No messages yet"}
                description={
                  messages?.length
                    ? "No message matches the search, the filter or the selected socket."
                    : "Messages your sockets receive and send are listed here."
                }
              />
            ) : (
              <Table className="flex-1" wrapperClassName="pb-4">
                <TableHeader className="sticky top-0 z-10 bg-sidebar">
                  <TableRow>
                    <TableHead />
                    <TableHead>Time</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((message) => (
                    <MessageRow
                      key={message.id}
                      message={message}
                      selected={message.id === detailsMessageId}
                      onOpen={() => openDetails(name, message.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </Section>
      {details && <MessageDetails application={name} message={details} />}
    </div>
  );
};
