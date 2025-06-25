/* eslint-disable @typescript-eslint/no-var-requires */
import { ComponentType, SVGProps } from "react";
import { Book, LucideProps } from "lucide-react";

import { isBrowser } from "./utils/is-browser";

const ReactIcon = isBrowser() ? require("../static/img/integration-react.svg").default : () => null;
const HFIcon = isBrowser() ? require("../static/img/integration-hyper-fetch.svg").default : () => null;
const SocketsIcon = isBrowser() ? require("../static/img/integration-sockets.svg").default : () => null;
const HyperFlowIcon = isBrowser() ? require("../static/img/hyper-flow.svg").default : () => null;

export type Section = {
  label: string;
  description: string;
  dir: string;
  /**
   * @important
   * Names provides backwards compatibility with the old sidebars
   * This way we can add more paths if we rename something
   */
  paths: string[];
  img:
    | React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
    | ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;
  text: string;
  textAction: string;
  textHover: string;
  icon: string;
  iconHover: string;
  border: string;
  borderHover: string;
  category: string;
  featured?: boolean;
  isPackage: boolean;
  isNew?: boolean;
  isPro?: boolean;
} & (
  | {
      isPackage: false;
      package?: string;
    }
  | {
      isPackage: true;
      package: string;
    }
);

/**
 * This sections list must support backward compatibility with the old sidebars and sections
 * To extend it or change the order, you must update the paths or the order of these sections in the array
 *
 * @Example Matching of the sidebar and folders are done through the paths array, it should include the name of folder
 */
export const modules: Section[] = [
  {
    label: "Getting Started",
    description:
      "Start your journey with Hyper Fetch. Learn core concepts, installation, and basic setup to get up and running quickly.",
    isPackage: false,
    dir: "getting-started",
    paths: ["getting-started"],
    img: Book,
    text: "drop-shadow-sm !text-yellow-500 dark:!text-yellow-400",
    textAction:
      "focus:!text-yellow-500 focus:dark:!text-yellow-400 active:!text-yellow-600 active:dark:!text-yellow-300",
    textHover: "hover:!text-yellow-500 hover:dark:!text-yellow-400",
    icon: "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-500 bg-yellow-400 dark:bg-yellow-500",
    iconHover:
      "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-500 group-hover:bg-yellow-400 group-hover:dark:bg-yellow-500",
    border: "border-yellow-500 dark:border-yellow-400",
    borderHover: "hover:border-yellow-500 hover:dark:border-yellow-400",
    category: "docs",
  },
  {
    label: "Core",
    description:
      "Discover the framework-agnostic heart of Hyper Fetch, with powerful features for building robust API clients.",
    isPackage: true,
    dir: "core",
    paths: ["core"],
    img: HFIcon,
    text: "drop-shadow-sm !text-green-500 dark:!text-green-400",
    textAction: "focus:!text-green-500 focus:dark:!text-green-400 active:!text-green-600 active:dark:!text-green-300",
    textHover: "hover:!text-green-500 hover:dark:!text-green-400",
    icon: "group-hover:shadow-green-200 dark:group-hover:bg-green-500 bg-green-400 dark:bg-green-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-green-200 dark:group-hover:bg-green-500 group-hover:bg-green-400 group-hover:dark:bg-green-500 !bg-opacity-40",
    border: "border-green-500 dark:border-green-400",
    borderHover: "hover:border-green-500 hover:dark:border-green-400",
    category: "Framework",
    package: "core",
  },
  {
    label: "Sockets",
    description:
      "Enable real-time communication in your application with our WebSockets module for seamless data exchange.",
    isPackage: true,
    dir: "sockets",
    paths: ["sockets"],
    img: SocketsIcon,
    text: "drop-shadow-sm !text-blue-500 dark:!text-blue-400",
    textAction: "focus:!text-blue-500 focus:dark:!text-blue-400 active:!text-blue-600 active:dark:!text-blue-300",
    textHover: "hover:!text-blue-500 hover:dark:!text-blue-400",
    icon: "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 bg-blue-400 dark:bg-blue-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 group-hover:bg-blue-400 group-hover:dark:bg-blue-500 !bg-opacity-40",
    border: "border-blue-500 dark:border-blue-400",
    borderHover: "hover:border-blue-500 hover:dark:border-blue-400",
    category: "Framework",
    package: "sockets",
  },
  {
    label: "React",
    description:
      "Integrate Hyper Fetch into your React applications with custom hooks for effortless data fetching and state management.",
    isPackage: true,
    dir: "react",
    paths: ["react"],
    img: ReactIcon,
    text: "drop-shadow-sm !text-sky-500 dark:!text-sky-400",
    textAction: "focus:!text-sky-500 focus:dark:!text-sky-400 active:!text-sky-600 active:dark:!text-sky-300",
    textHover: "hover:!text-sky-500 hover:dark:!text-sky-400",
    icon: "group-hover:shadow-sky-200 dark:group-hover:bg-sky-500 bg-sky-400 dark:bg-sky-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-sky-200 dark:group-hover:bg-sky-500 group-hover:bg-sky-400 group-hover:dark:bg-sky-500 !bg-opacity-40",
    border: "border-sky-500 dark:border-sky-400",
    borderHover: "hover:border-sky-500 hover:dark:border-sky-400",
    category: "Framework",
    package: "react",
  },
  {
    label: "HyperFlow",
    description:
      "A powerful devtool for building, testing, and debugging your API connections, enhancing your development workflow.",
    isPackage: false,
    dir: "hyper-flow",
    paths: ["hyper-flow"],
    img: HyperFlowIcon,
    text: "drop-shadow-sm !text-yellow-500 dark:!text-yellow-400",
    textAction:
      "focus:!text-yellow-500 focus:dark:!text-yellow-400 active:!text-yellow-600 active:dark:!text-yellow-300",
    textHover: "hover:!text-yellow-500 hover:dark:!text-yellow-400",
    icon: "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-500 bg-yellow-400 dark:bg-yellow-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-500 group-hover:bg-yellow-400 group-hover:dark:bg-yellow-500 !bg-opacity-40",
    border: "border-yellow-500 dark:border-yellow-400",
    borderHover: "hover:border-yellow-500 hover:dark:border-yellow-400",
    category: "Framework",
    package: "react",
    isPro: true,
  },
];
