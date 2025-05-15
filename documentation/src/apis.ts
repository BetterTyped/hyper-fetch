import { Book } from "lucide-react";

import { Section } from "./modules";

export const apiOverviewSection: Section = {
  label: "Getting Started",
  description: "",
  category: "Docs",
  isPackage: false,
  dir: "getting-started",
  paths: ["getting-started"],
  img: Book,
  text: "drop-shadow-sm !text-orange-500 dark:!text-orange-400",
  textAction: "focus:!text-orange-500 focus:dark:!text-orange-400 active:!text-orange-600 active:dark:!text-orange-300",
  textHover: "hover:!text-orange-500 hover:dark:!text-orange-400",
  icon: "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 bg-orange-400 dark:bg-orange-500",
  iconHover:
    "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 group-hover:bg-orange-400 group-hover:dark:bg-orange-500 group-hover:!bg-opacity-40",
  border: "border-orange-500 dark:border-orange-400",
  borderHover: "hover:border-orange-500 hover:dark:border-orange-400",
};
