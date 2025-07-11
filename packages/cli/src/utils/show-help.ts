import { z } from "zod";
import { zodToTable } from "./zod-to-table";
import Table from "cli-table3";

export const showHelp = (schema: z.ZodType) => {
  const rows = zodToTable(schema).map(({ name, description }) => [`--${name}`, description || ""]);

  const maxOptionLength = rows.reduce((max, row) => Math.max(max, row[0].length), 0);
  const terminalWidth = process.stdout.columns;

  const tableOptions: Table.TableConstructorOptions = {
    head: ["Option", "Description"],
    style: {
      head: ["blue"],
    },
    wordWrap: true,
  };

  if (terminalWidth) {
    // Accounting for borders and padding.
    const tableOverhead = 7;
    const optionColWidth = maxOptionLength + 2;
    const descriptionColWidth = terminalWidth - optionColWidth - tableOverhead;

    if (descriptionColWidth > 10) {
      tableOptions.colWidths = [optionColWidth, descriptionColWidth];
    }
  }

  const table = new Table(tableOptions);

  table.push(...rows);

  console.log(table.toString());
};
