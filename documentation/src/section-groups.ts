import type { PickerGroup } from "./components/sidebar-menu/section-picker";
import type { Section } from "./modules";

/*
 * Groups for the section pickers at the top of the docs and guides sidebars. A section joins the first group that
 * matches it; anything no group matches lands in the last group, so a new section is never dropped.
 */

type SectionGroup = PickerGroup & { match: (section: Section) => boolean };

const packages = ["Core", "Sockets", "DB", "React"];

const docsGroups: SectionGroup[] = [
  {
    title: "Packages",
    short: "Packages",
    match: (section) => packages.includes(section.label),
  },
  { title: "Tools", short: "Tools", match: () => true },
];

const guideGroups: SectionGroup[] = [
  {
    title: "Packages",
    short: "Packages",
    match: (section) => packages.includes(section.label),
  },
  { title: "Topics", short: "Topics", match: () => true },
];

const createGroupLookup = (groups: SectionGroup[]) => ({
  groupOf: (section: Section): PickerGroup =>
    groups.find((group) => group.match(section)) ?? groups[groups.length - 1],
  groupIndexOf: (section: Section): number => {
    const index = groups.findIndex((group) => group.match(section));
    return index === -1 ? groups.length : index;
  },
});

/** The group a docs section is listed under, and its position */
export const docsGroupLookup = createGroupLookup(docsGroups);

/** The group a guide is listed under, and its position */
export const guideGroupLookup = createGroupLookup(guideGroups);
