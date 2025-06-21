import { CheckCircle2, CircleFadingArrowUp, Calendar } from "lucide-react";
import { format } from "date-fns";

import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { DevtoolsRequestEvent } from "@/context/applications/types";
import { getStatus, RequestStatusIcon } from "@/utils/request.status.utils";
import { Badge } from "@/components/ui/badge";

export const SectionOverview = ({ item }: { item: DevtoolsRequestEvent }) => {
  const status = getStatus(item);

  const isValidStatusType = typeof item.response?.status === "number" || typeof item.response?.status === "string";
  const isValidResponseTimestampType =
    typeof item.response?.responseTimestamp === "number" || typeof item.response?.responseTimestamp === "string";

  return (
    <div>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5" />
              Status:
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <RequestStatusIcon status={status} />
                {status}
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <CircleFadingArrowUp className="w-5 h-5" />
              Code:
            </TableCell>
            <TableCell>
              {isValidStatusType ? (
                <Badge variant={item.isSuccess ? "success" : "secondary"}>{String(item.response?.status)}</Badge>
              ) : (
                <Badge variant="secondary">Unknown</Badge>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              Response Date:
            </TableCell>
            <TableCell>
              {isValidResponseTimestampType ? (
                <>
                  <span className="text-muted-foreground">
                    {format(new Date(item.response?.responseTimestamp ?? 0), "yyyy-MM-dd")}
                  </span>
                  <span className="ml-2">{format(new Date(item.response?.responseTimestamp ?? 0), "HH:mm:ss")}</span>
                </>
              ) : (
                <Badge variant="secondary">Unknown</Badge>
              )}
            </TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <ShieldCheck className="w-5 h-5" />
              Request ID:
            </TableCell>
            <TableCell>{String(item.requestId)}</TableCell>
          </TableRow> */}
        </TableBody>
      </Table>
    </div>
  );
};
