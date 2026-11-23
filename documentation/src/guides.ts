/* eslint-disable @typescript-eslint/no-var-requires */
import { Book, FlaskConical, Scale } from "lucide-react";

import { Section } from "./modules";
import { isBrowser } from "./utils/is-browser";

const ReactIcon = isBrowser() ? require("../static/img/integration-react.svg").default : () => null;
const HFIcon = isBrowser() ? require("../static/img/integration-hyper-fetch.svg").default : () => null;
const SocketsIcon = isBrowser() ? require("../static/img/integration-sockets.svg").default : () => null;
const DbIcon = isBrowser() ? require("../static/img/integration-db.svg").default : () => null;
const TypescriptIcon = isBrowser() ? require("../static/img/typescript.svg").default : () => null;

export const guides: Section[] = [
  {
    label: "Getting Started",
    description: "Where the guides start, plus community and further resources",
    isPackage: false,
    dir: "getting-started",
    paths: ["getting-started"],
    img: Book,
    text: "drop-shadow-sm !text-indigo-500 dark:!text-indigo-400",
    textAction:
      "focus:!text-indigo-500 focus:dark:!text-indigo-400 active:!text-indigo-600 active:dark:!text-indigo-300",
    textHover: "hover:!text-indigo-500 hover:dark:!text-indigo-400",
    icon: "group-hover:shadow-indigo-200 dark:group-hover:bg-indigo-500 bg-indigo-400 dark:bg-indigo-500",
    iconHover:
      "group-hover:shadow-indigo-200 dark:group-hover:bg-indigo-500 group-hover:bg-indigo-400 group-hover:dark:bg-indigo-500 group-hover:!bg-opacity-40",
    border: "border-indigo-500 dark:border-indigo-400",
    borderHover: "hover:border-indigo-500 hover:dark:border-indigo-400",
    category: "Guides",
  },
  {
    label: "Core",
    description: "Fetching, auth, errors, retries, cache revalidation, offline and custom adapters",
    isPackage: false,
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
    category: "Guides",
  },
  {
    label: "Sockets",
    description: "WebSocket and SSE setup, auth, reconnection and how they compare",
    isPackage: false,
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
    category: "Guides",
  },
  {
    label: "DB",
    description: "Collections, live queries, optimistic writes, real-time sync and offline-first apps",
    isPackage: false,
    dir: "db",
    paths: ["db"],
    img: DbIcon,
    text: "drop-shadow-sm !text-violet-500 dark:!text-violet-400",
    textAction:
      "focus:!text-violet-500 focus:dark:!text-violet-400 active:!text-violet-600 active:dark:!text-violet-300",
    textHover: "hover:!text-violet-500 hover:dark:!text-violet-400",
    icon: "group-hover:shadow-violet-200 dark:group-hover:bg-violet-500 bg-violet-400 dark:bg-violet-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-violet-200 dark:group-hover:bg-violet-500 group-hover:bg-violet-400 group-hover:dark:bg-violet-500 !bg-opacity-40",
    border: "border-violet-500 dark:border-violet-400",
    borderHover: "hover:border-violet-500 hover:dark:border-violet-400",
    category: "Guides",
  },
  {
    label: "React",
    description: "Fetching, pagination, infinite scroll, optimistic updates and Next.js with hooks",
    isPackage: false,
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
    category: "Guides",
  },
  {
    label: "Typescript",
    description: "Extend the types and type global and local errors",
    isPackage: false,
    dir: "typescript",
    paths: ["typescript"],
    img: TypescriptIcon,
    text: "drop-shadow-sm !text-blue-500 dark:!text-blue-400",
    textAction: "focus:!text-blue-500 focus:dark:!text-blue-400 active:!text-blue-600 active:dark:!text-blue-300",
    textHover: "hover:!text-blue-500 hover:dark:!text-blue-400",
    icon: "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 bg-blue-400 dark:bg-blue-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 group-hover:bg-blue-400 group-hover:dark:bg-blue-500 !bg-opacity-40",
    border: "border-blue-500 dark:border-blue-400",
    borderHover: "hover:border-blue-500 hover:dark:border-blue-400",
    category: "Guides",
  },
  {
    label: "Testing",
    description: "Mock requests and keep specs isolated",
    isPackage: false,
    dir: "testing",
    paths: ["testing"],
    img: FlaskConical,
    text: "drop-shadow-sm !text-purple-500 dark:!text-purple-400",
    textAction:
      "focus:!text-purple-500 focus:dark:!text-purple-400 active:!text-purple-600 active:dark:!text-purple-300",
    textHover: "hover:!text-purple-500 hover:dark:!text-purple-400",
    icon: "group-hover:shadow-purple-200 dark:group-hover:bg-purple-500 bg-purple-400 dark:bg-purple-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-purple-200 dark:group-hover:bg-purple-500 group-hover:bg-purple-400 group-hover:dark:bg-purple-500 !bg-opacity-40",
    border: "border-purple-500 dark:border-purple-400",
    borderHover: "hover:border-purple-500 hover:dark:border-purple-400",
    category: "Guides",
  },
  {
    label: "Comparisons",
    description: "How Hyper Fetch compares to TanStack Query, SWR, RTK Query, Apollo Client and Axios",
    isPackage: false,
    dir: "comparisons",
    paths: ["comparisons"],
    img: Scale,
    text: "drop-shadow-sm !text-amber-500 dark:!text-amber-400",
    textAction: "focus:!text-amber-500 focus:dark:!text-amber-400 active:!text-amber-600 active:dark:!text-amber-300",
    textHover: "hover:!text-amber-500 hover:dark:!text-amber-400",
    icon: "group-hover:shadow-amber-200 dark:group-hover:bg-amber-500 bg-amber-400 dark:bg-amber-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-amber-200 dark:group-hover:bg-amber-500 group-hover:bg-amber-400 group-hover:dark:bg-amber-500 !bg-opacity-40",
    border: "border-amber-500 dark:border-amber-400",
    borderHover: "hover:border-amber-500 hover:dark:border-amber-400",
    category: "Guides",
  },
];
