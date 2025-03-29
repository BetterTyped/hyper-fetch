import { useMemo } from "react";

import { Table, TableHeader, TableBody, TableRow, TableCell } from "frontend/components/ui/table";
import { DevtoolsExplorerRequest } from "../../list/content.types";
import { TableSortable } from "frontend/components/ui/table-sortable";

export const TabParams = ({ item }: { item: DevtoolsExplorerRequest }) => {
  const parameters: string[] = useMemo(() => {
    const groupRegex = /:([A-Za-z0-9_]+)([?+*]?)/g;
    const matches = item.request.endpoint.match(groupRegex);
    if (!matches) return [];
    return matches;
  }, [item.request.endpoint]);

  return (
    <div>
      {!!parameters.length && (
        <Table>
          <TableHeader>
            <TableSortable sort={null} onSort={() => {}}>
              Parameter
            </TableSortable>
            <TableSortable sort={null} onSort={() => {}}>
              Value
            </TableSortable>
          </TableHeader>
          <TableBody>
            {parameters.map((parameter) => {
              return (
                <TableRow key={parameter}>
                  <TableCell>{parameter}</TableCell>
                  <TableCell aria-label="parameter-value">
                    <input type="text" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
