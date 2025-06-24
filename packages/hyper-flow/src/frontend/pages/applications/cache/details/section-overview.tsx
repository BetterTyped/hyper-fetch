import { Calendar, Trash2, ScanEye, Package } from "lucide-react";
import { format } from "date-fns";

import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { DevtoolsCacheEvent } from "@/context/applications/types";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown/countdown";

export const SectionOverview = ({
  item,
  listeners,
  setStale,
}: {
  item: DevtoolsCacheEvent;
  listeners: number;
  setStale: (stale: boolean) => void;
}) => {
  const isValidResponseTimestampType =
    typeof item.cacheData.responseTimestamp === "number" || typeof item.cacheData.responseTimestamp === "string";

  return (
    <div>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <ScanEye className="w-5 h-5" />
              Cache Listeners:
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">{listeners}</div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              Last Updated:
            </TableCell>
            <TableCell>
              {isValidResponseTimestampType ? (
                <>
                  <span className="text-muted-foreground">
                    {format(new Date(item.cacheData.responseTimestamp ?? 0), "yyyy-MM-dd")}
                  </span>
                  <span className="ml-2">{format(new Date(item.cacheData.responseTimestamp ?? 0), "HH:mm:ss")}</span>
                </>
              ) : (
                <Badge variant="secondary">Unknown</Badge>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <Package className="w-5 h-5" />
              Time left before stale:
            </TableCell>
            <TableCell>
              <Countdown
                value={item.cacheData.responseTimestamp + item.cacheData.staleTime}
                onDone={() => setStale(true)}
                onStart={() => setStale(false)}
                doneText={<Badge variant="secondary">Cache data is stale</Badge>}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <Trash2 className="w-5 h-5" />
              Time left for garbage collection:
            </TableCell>
            <TableCell>
              <Countdown
                value={item.cacheData.responseTimestamp + item.cacheData.cacheTime}
                doneText={<Badge variant="secondary">Data was removed from cache</Badge>}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
