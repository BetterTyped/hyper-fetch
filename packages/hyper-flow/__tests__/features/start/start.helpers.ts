import { screen, within } from "@testing-library/react";

/** The card whose title is `title`. Cards are the closest `data-slot="card"` around the title. */
export const getCard = (title: string) => {
  const heading = screen.getByText(title, {
    selector: '[data-slot="card-title"], [data-slot="card-title"] *',
  });
  return within(heading.closest<HTMLElement>('[data-slot="card"]')!);
};

/** Value rendered right after a stat label, as in `<p>Total Requests</p><p>7</p>`. */
export const getStatValue = (card: ReturnType<typeof getCard>, label: string) =>
  card.getByText(label).nextElementSibling?.textContent ?? null;

/** Text of every body row of the table inside a card, cells joined with " | ". */
export const getTableRows = (card: ReturnType<typeof getCard>) => {
  const table = card.queryByRole("table");
  if (!table) {
    return [];
  }
  return within(table)
    .getAllByRole("row")
    .filter((row) => row.closest("tbody"))
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent?.replaceAll(/\s+/g, " ").trim() ?? "")
        .join(" | "),
    );
};

/** Parses "12.34ms" / "1.20s" into milliseconds. */
export const parseTime = (text: string | null | undefined) => {
  const match = /([\d.]+)\s*(ms|s|m)/.exec(text ?? "");
  if (!match) {
    return Number.NaN;
  }
  const value = parseFloat(match[1]);
  if (match[2] === "s") {
    return value * 1000;
  }
  if (match[2] === "m") {
    return value * 60_000;
  }
  return value;
};
