/* eslint-disable @typescript-eslint/no-var-requires */
import { Book } from "lucide-react";

import { Section } from "./modules";
import { isBrowser } from "./utils/is-browser";

const AxiosIcon = isBrowser() ? require("../static/img/integration-axios.svg").default : () => null;
// const ReactIcon = isBrowser() ? require("../static/img/integration-react.svg").default : () => null;
// const NextIcon = isBrowser() ? require("../static/img/integration-next.svg").default : () => null;
// const RemixIcon = isBrowser() ? require("../static/img/integration-remix.svg").default : () => null;
// const AstroIcon = isBrowser() ? require("../static/img/integration-astro.svg").default : () => null;
// const NestIcon = isBrowser() ? require("../static/img/integration-nest.svg").default : () => null;
const GraphqlIcon = isBrowser() ? require("../static/img/integration-graphql.svg").default : () => null;
// const RestIcon = isBrowser() ? require("../static/img/integration-rest.svg").default : () => null;
// const StrapiIcon = isBrowser() ? require("../static/img/integration-strapi.svg").default : () => null;
// const HasuraIcon = isBrowser() ? require("../static/img/integration-hasura.svg").default : () => null;
// const AppwriteIcon = isBrowser() ? require("../static/img/integration-appwrite.svg").default : () => null;
// const AirtableIcon = isBrowser() ? require("../static/img/integration-airtable.svg").default : () => null;
// const MedusaIcon = isBrowser() ? require("../static/img/integration-medusa.svg").default : () => null;
const FirebaseIcon = isBrowser() ? require("../static/img/integration-firebase.svg").default : () => null;
// const SocketsIcon = isBrowser() ? require("../static/img/integration-sockets.svg").default : () => null;
// const KindeIcon = isBrowser() ? require("../static/img/integration-kinde.svg").default : () => null;
// const ClerkIcon = isBrowser() ? require("../static/img/integration-clerk.svg").default : () => null;
// const MapboxIcon = isBrowser() ? require("../static/img/integration-mapbox.svg").default : () => null;
// const GoogleMapsIcon = isBrowser() ? require("../static/img/integration-google-maps.svg").default : () => null;
const OpenApiIcon = isBrowser() ? require("../static/img/integration-openapi.svg").default : () => null;
const EslintIcon = isBrowser() ? require("../static/img/integration-eslint.svg").default : () => null;
const HFIcon = isBrowser() ? require("../static/img/integration-hf.svg").default : () => null;

export const integrations: Section[] = [
  {
    label: "Getting Started",
    description: "Overview of the available integrations",
    isPackage: false,
    dir: "getting-started",
    paths: ["getting-started"],
    img: Book,
    text: "drop-shadow-sm !text-blue-500 dark:!text-blue-400",
    textAction: "focus:!text-blue-500 focus:dark:!text-blue-400 active:!text-blue-600 active:dark:!text-blue-300",
    textHover: "hover:!text-blue-500 hover:dark:!text-blue-400",
    icon: "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 bg-blue-400 dark:bg-blue-500",
    iconHover:
      "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 group-hover:bg-blue-400 group-hover:dark:bg-blue-500 group-hover:!bg-opacity-40",
    border: "border-blue-500 dark:border-blue-400",
    borderHover: "hover:border-blue-500 hover:dark:border-blue-400",
    category: "docs",
  },
  {
    label: "ESLint",
    description: "ESLint rules to enforce more typescript best practices",
    dir: "plugin-eslint",
    isPackage: true,
    paths: ["plugin-eslint"],
    img: EslintIcon,
    text: "drop-shadow-sm !text-zinc-500 dark:!text-zinc-300",
    textAction: "focus:!text-zinc-500 focus:dark:!text-zinc-300 active:!text-zinc-600 active:dark:!text-zinc-200",
    textHover: "hover:!text-zinc-500 hover:dark:!text-zinc-400",
    icon: "group-hover:shadow-zinc-200 dark:group-hover:bg-zinc-300 bg-zinc-400 dark:bg-zinc-300 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-zinc-200 dark:group-hover:bg-zinc-200 group-hover:bg-zinc-400 group-hover:dark:bg-zinc-200 !bg-opacity-40",
    border: "border-zinc-500 dark:border-zinc-300",
    borderHover: "hover:border-zinc-500 hover:dark:border-zinc-200",
    featured: true,
    category: "Plugin",
  },
  {
    label: "Devtools",
    description: "Devtools to help you debug your code",
    dir: "plugin-devtools",
    isPackage: true,
    paths: ["plugin-devtools"],
    img: HFIcon,
    text: "drop-shadow-sm !text-yellow-500 dark:!text-yellow-300",
    textAction:
      "focus:!text-yellow-500 focus:dark:!text-yellow-300 active:!text-yellow-600 active:dark:!text-yellow-200",
    textHover: "hover:!text-yellow-500 hover:dark:!text-yellow-400",
    icon: "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-300 bg-yellow-400 dark:bg-yellow-300 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-200 group-hover:bg-yellow-400 group-hover:dark:bg-yellow-200 !bg-opacity-40",
    border: "border-yellow-500 dark:border-yellow-300",
    borderHover: "hover:border-yellow-500 hover:dark:border-yellow-200",
    featured: true,
    category: "Plugin",
  },
  {
    label: "Axios",
    description: "Adapter for Axios",
    dir: "adapter-axios",
    isPackage: true,
    paths: ["adapter-axios"],
    img: AxiosIcon,
    text: "drop-shadow-sm !text-purple-500 dark:!text-purple-400",
    textAction:
      "focus:!text-purple-500 focus:dark:!text-purple-400 active:!text-purple-600 active:dark:!text-purple-300",
    textHover: "hover:!text-purple-500 hover:dark:!text-purple-400",
    icon: "group-hover:shadow-purple-200 dark:group-hover:bg-purple-500 bg-purple-400 dark:bg-purple-500",
    iconHover:
      "group-hover:shadow-purple-200 dark:group-hover:bg-purple-500 group-hover:bg-purple-400 group-hover:dark:bg-purple-500",
    border: "border-purple-500 dark:border-purple-400",
    borderHover: "hover:border-purple-500 hover:dark:border-purple-400",
    category: "Adapter",
  },
  {
    label: "Graphql",
    description: "Adapter for GraphQL",
    dir: "adapter-graphql",
    isPackage: true,
    paths: ["adapter-graphql"],
    img: GraphqlIcon,
    text: "drop-shadow-sm !text-purple-500 dark:!text-pink-400",
    textAction: "focus:!text-pink-500 focus:dark:!text-pink-400 active:!text-pink-600 active:dark:!text-pink-300",
    textHover: "hover:!text-pink-500 hover:dark:!text-pink-400",
    icon: "group-hover:shadow-pink-200 dark:group-hover:bg-pink-500 bg-pink-400 dark:bg-pink-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-pink-200 dark:group-hover:bg-pink-500 group-hover:bg-pink-400 group-hover:dark:bg-pink-500 !bg-opacity-40",
    border: "border-pink-500 dark:border-pink-400",
    borderHover: "hover:border-pink-500 hover:dark:border-pink-400",
    featured: true,
    category: "Adapter",
  },
  {
    label: "Firebase",
    description: "Adapter for Firebase",
    dir: "adapter-firebase",
    isPackage: true,
    paths: ["adapter-firebase"],
    img: FirebaseIcon,
    text: "drop-shadow-sm !text-orange-500 dark:!text-orange-400",
    textAction:
      "focus:!text-orange-500 focus:dark:!text-orange-400 active:!text-orange-600 active:dark:!text-orange-300",
    textHover: "hover:!text-orange-500 hover:dark:!text-orange-400",
    icon: "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 bg-orange-400 dark:bg-orange-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 group-hover:bg-orange-400 group-hover:dark:bg-orange-500 !bg-opacity-40",
    border: "border-orange-500 dark:border-orange-400",
    borderHover: "hover:border-orange-500 hover:dark:border-orange-400",
    featured: true,
    category: "Service",
  },
  {
    label: "Firebase Admin",
    description: "Adapter for Firebase Admin",
    dir: "adapter-firebase-admin",
    isPackage: true,
    paths: ["adapter-firebase-admin"],
    img: FirebaseIcon,
    text: "drop-shadow-sm !text-red-500 dark:!text-red-400",
    textAction: "focus:!text-red-500 focus:dark:!text-red-400 active:!text-red-600 active:dark:!text-red-300",
    textHover: "hover:!text-red-500 hover:dark:!text-red-400",
    icon: "group-hover:shadow-red-200 dark:group-hover:bg-red-500 bg-red-400 dark:bg-red-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-red-200 dark:group-hover:bg-red-500 group-hover:bg-red-400 group-hover:dark:bg-red-500 !bg-opacity-40",
    border: "border-red-500 dark:border-red-400",
    borderHover: "hover:border-red-500 hover:dark:border-red-400",
    category: "Service",
  },
  {
    label: "Codegen Openapi",
    description: "Codegen for Openapi",
    dir: "codegen-openapi",
    isPackage: true,
    paths: ["codegen-openapi"],
    img: OpenApiIcon,
    text: "drop-shadow-sm !text-lime-500 dark:!text-lime-400",
    textAction: "focus:!text-lime-500 focus:dark:!text-lime-400 active:!text-lime-600 active:dark:!text-lime-300",
    textHover: "hover:!text-lime-500 hover:dark:!text-lime-400",
    icon: "group-hover:shadow-lime-200 dark:group-hover:bg-lime-500 bg-lime-400 dark:bg-lime-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-lime-200 dark:group-hover:bg-lime-500 group-hover:bg-lime-400 group-hover:dark:bg-lime-500 !bg-opacity-40",
    border: "border-lime-500 dark:border-lime-400",
    borderHover: "hover:border-lime-500 hover:dark:border-lime-400",
    featured: true,
    category: "Codegen",
  },
];
