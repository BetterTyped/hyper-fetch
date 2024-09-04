import { useMemo } from "react";

import * as Table from "components/table/table";
import { DevtoolsExplorerRequest } from "pages/explorer/sidebar/content.types";

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
        <Table.Root>
          <Table.Header>
            <Table.Sortable>Parameter</Table.Sortable>
            <Table.Sortable>Value</Table.Sortable>
          </Table.Header>
          <Table.Body>
            {parameters.map((parameter) => {
              return (
                <Table.Row key={parameter}>
                  <Table.Cell>{parameter}</Table.Cell>
                  <Table.Cell aria-label="parameter-value">
                    <input type="text" />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      )}
    </div>
  );
};
