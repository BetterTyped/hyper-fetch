import { useMemo } from "react";

import { Label } from "components/table/label/label";
import { Table } from "components/table/table";
import { DevtoolsExplorerRequest } from "pages/explorer/content/content.types";

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
          <thead>
            <Label>Parameter</Label>
            <Label>Value</Label>
          </thead>
          <tbody>
            {parameters.map((parameter) => {
              return (
                <tr key={parameter}>
                  <td>{parameter}</td>
                  <td aria-label="parameter-value">
                    <input type="text" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
};
