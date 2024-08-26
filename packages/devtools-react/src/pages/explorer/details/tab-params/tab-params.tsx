import { useMemo } from "react";
import { RequestInstance } from "@hyper-fetch/core";

import { Label } from "components/table/label/label";
import { Table } from "components/table/table";

export const TabParams = ({ item }: { item: RequestInstance }) => {
  const parameters: string[] = useMemo(() => {
    const groupRegex = /:([A-Za-z0-9_]+)([?+*]?)/g;
    const matches = item.endpoint.match(groupRegex);
    if (!matches) return [];
    return matches;
  }, [item.endpoint]);

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
