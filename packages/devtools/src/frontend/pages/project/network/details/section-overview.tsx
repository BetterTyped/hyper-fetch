import { CheckCircle2, CircleFadingArrowUp, ShieldCheck } from "lucide-react";

import { Table, TableBody, TableRow, TableCell } from "frontend/components/ui/table";
import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { getStatus, RequestStatusIcon } from "frontend/utils/request.status.utils";

export const SectionOverview = ({ item }: { item: DevtoolsRequestEvent }) => {
  const status = getStatus(item);

  return (
    <div>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5" />
              Success:
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
              Status Code:
            </TableCell>
            <TableCell>{String(item.response?.status ?? "")}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="flex items-center gap-2 h-11 text-muted-foreground">
              <ShieldCheck className="w-5 h-5" />
              Request ID:
            </TableCell>
            <TableCell>{String(item.requestId)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
