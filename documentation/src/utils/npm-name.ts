import type { Section } from "../modules";

/** npm names that do not follow `@hyper-fetch/<package>` */
const npmNames: Record<string, string> = {
  "hyper-fetch": "@hyper-fetch/cli",
  "plugin-eslint": "eslint-plugin-hyper-fetch",
  "plugin-oxlint": "oxlint-plugin-hyper-fetch",
};

/** The name a section's package is published under, or null when the section is a guide without a package */
export const npmNameOf = (section: Section): string | null =>
  section.package
    ? (npmNames[section.package] ?? `@hyper-fetch/${section.package}`)
    : null;
