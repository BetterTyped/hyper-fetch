import type { LucideProps } from "lucide-react";
import { Flame, GitGraph, Server } from "lucide-react";

const adapterIcons = {
  firebase: Flame,
  http: Server,
  graphql: GitGraph,
  default: Server,
};

const iconsKeys = Object.keys(adapterIcons);

export const AdapterIcon = ({ name = "", ...props }: { name: string } & LucideProps) => {
  const icon = iconsKeys.find((key) => name.includes(key));
  const Icon = icon ? adapterIcons[icon as keyof typeof adapterIcons] : adapterIcons.default;
  return <Icon {...props} />;
};
