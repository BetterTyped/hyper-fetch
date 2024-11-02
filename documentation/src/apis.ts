import { Book } from "lucide-react";

import { Section } from "./modules";

export const apiOverviewSection: Section = {
  label: "Getting Started",
  description: "",
  isPackage: false,
  dir: "getting-started",
  paths: ["getting-started"],
  img: Book,
  text: "drop-shadow-sm !text-yellow-500 dark:!text-yellow-400",
  textAction: "focus:!text-yellow-500 focus:dark:!text-yellow-400 active:!text-yellow-600 active:dark:!text-yellow-300",
  textHover: "hover:!text-yellow-500 hover:dark:!text-yellow-400",
  icon: "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-500 bg-yellow-400 dark:bg-yellow-500",
  iconHover:
    "hover:group-hover:shadow-yellow-200 hover:dark:group-hover:bg-yellow-500 hover:bg-yellow-400 hover:dark:bg-yellow-500",
  border: "border-yellow-500 dark:border-yellow-400",
  borderHover: "hover:border-yellow-500 hover:dark:border-yellow-400",
};
