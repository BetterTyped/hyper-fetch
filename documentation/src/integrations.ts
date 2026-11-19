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
// oxc icon, CC BY-NC-SA 4.0, see static/img/ATTRIBUTION.md
const OxlintIcon = isBrowser() ? require("../static/img/integration-oxlint.svg").default : () => null;
const HonoIcon = isBrowser() ? require("../static/img/integration-hono.svg").default : () => null;
const ElysiaIcon = isBrowser() ? require("../static/img/integration-elysia.svg").default : () => null;
const OrpcIcon = isBrowser() ? require("../static/img/integration-orpc.svg").default : () => null;
const TrpcIcon = isBrowser() ? require("../static/img/integration-trpc.svg").default : () => null;
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
const HFIcon = isBrowser() ? require("../static/img/integration-hyper-fetch.svg").default : () => null;

export const integrations: Section[] = [
  {
    label: "Getting Started",
    description: "Discover how to integrate Hyper Fetch with various libraries and services to boost your workflow.",
    isPackage: false,
    dir: "getting-started",
    paths: ["getting-started"],
    img: Book,
    text: "drop-shadow-sm !text-green-500 dark:!text-green-400",
    textAction: "focus:!text-green-500 focus:dark:!text-green-400 active:!text-green-600 active:dark:!text-green-300",
    textHover: "hover:!text-green-500 hover:dark:!text-green-400",
    icon: "group-hover:shadow-green-200 dark:group-hover:bg-green-500 bg-green-400 dark:bg-green-500",
    iconHover:
      "group-hover:shadow-green-200 dark:group-hover:bg-green-500 group-hover:bg-green-400 group-hover:dark:bg-green-500 group-hover:!bg-opacity-40",
    border: "border-green-500 dark:border-green-400",
    borderHover: "hover:border-green-500 hover:dark:border-green-400",
    category: "docs",
  },
  {
    label: "ESLint",
    description: "Enforce coding standards and prevent common errors in your codebase with our official ESLint plugin.",
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
    package: "plugin-eslint",
  },
  {
    label: "Oxlint",
    description:
      "Run the HyperFetch lint rules on Oxlint, the Rust linter, with the same rule names as the ESLint plugin.",
    dir: "plugin-oxlint",
    isPackage: true,
    paths: ["plugin-oxlint"],
    img: OxlintIcon,
    text: "drop-shadow-sm !text-sky-500 dark:!text-sky-400",
    textAction: "focus:!text-sky-500 focus:dark:!text-sky-400 active:!text-sky-600 active:dark:!text-sky-300",
    textHover: "hover:!text-sky-500 hover:dark:!text-sky-400",
    icon: "group-hover:shadow-sky-200 dark:group-hover:bg-sky-500 bg-sky-400 dark:bg-sky-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-sky-200 dark:group-hover:bg-sky-500 group-hover:bg-sky-400 group-hover:dark:bg-sky-500 !bg-opacity-40",
    border: "border-sky-500 dark:border-sky-400",
    borderHover: "hover:border-sky-500 hover:dark:border-sky-400",
    category: "Plugin",
    package: "plugin-oxlint",
  },
  {
    label: "Devtools",
    description: "Debug your application with our devtools, allowing you to inspect requests, cache, and performance.",
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
    package: "plugin-devtools",
  },
  {
    label: "Axios",
    description: "A popular, promise-based HTTP client for the browser and node.js, now integrated with Hyper Fetch.",
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
    package: "axios",
  },
  {
    label: "Hono",
    description: "Call your Hono backend through a typed SDK built from your routes and validators, with no codegen.",
    dir: "hono",
    isPackage: true,
    paths: ["hono"],
    img: HonoIcon,
    text: "drop-shadow-sm !text-orange-500 dark:!text-orange-400",
    textAction:
      "focus:!text-orange-500 focus:dark:!text-orange-400 active:!text-orange-600 active:dark:!text-orange-300",
    textHover: "hover:!text-orange-500 hover:dark:!text-orange-400",
    icon: "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 bg-orange-400 dark:bg-orange-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 group-hover:bg-orange-400 group-hover:dark:bg-orange-500 !bg-opacity-40",
    border: "border-orange-500 dark:border-orange-400",
    borderHover: "hover:border-orange-500 hover:dark:border-orange-400",
    category: "Service",
    package: "hono",
  },
  {
    label: "Elysia",
    description:
      "Call your Elysia backend through a typed SDK with responses, errors and inputs read from your routes.",
    dir: "elysia",
    isPackage: true,
    paths: ["elysia"],
    img: ElysiaIcon,
    text: "drop-shadow-sm !text-violet-500 dark:!text-violet-400",
    textAction:
      "focus:!text-violet-500 focus:dark:!text-violet-400 active:!text-violet-600 active:dark:!text-violet-300",
    textHover: "hover:!text-violet-500 hover:dark:!text-violet-400",
    icon: "group-hover:shadow-violet-200 dark:group-hover:bg-violet-500 bg-violet-400 dark:bg-violet-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-violet-200 dark:group-hover:bg-violet-500 group-hover:bg-violet-400 group-hover:dark:bg-violet-500 !bg-opacity-40",
    border: "border-violet-500 dark:border-violet-400",
    borderHover: "hover:border-violet-500 hover:dark:border-violet-400",
    category: "Service",
    package: "elysia",
  },
  {
    label: "Graphql",
    description: "Integrate with any GraphQL API to fetch data with type-safety and efficiency using this adapter.",
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
    package: "graphql",
  },
  {
    label: "oRPC",
    description: "Call oRPC procedures with types inferred from your router, with caching and React hooks included.",
    dir: "adapter-orpc",
    isPackage: true,
    paths: ["adapter-orpc"],
    img: OrpcIcon,
    text: "drop-shadow-sm !text-teal-500 dark:!text-teal-400",
    textAction: "focus:!text-teal-500 focus:dark:!text-teal-400 active:!text-teal-600 active:dark:!text-teal-300",
    textHover: "hover:!text-teal-500 hover:dark:!text-teal-400",
    icon: "group-hover:shadow-teal-200 dark:group-hover:bg-teal-500 bg-teal-400 dark:bg-teal-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-teal-200 dark:group-hover:bg-teal-500 group-hover:bg-teal-400 group-hover:dark:bg-teal-500 !bg-opacity-40",
    border: "border-teal-500 dark:border-teal-400",
    borderHover: "hover:border-teal-500 hover:dark:border-teal-400",
    category: "Adapter",
    package: "orpc",
  },
  {
    label: "tRPC",
    description: "Call tRPC procedures with types inferred from your router, with caching and React hooks included.",
    dir: "adapter-trpc",
    isPackage: true,
    paths: ["adapter-trpc"],
    img: TrpcIcon,
    text: "drop-shadow-sm !text-blue-500 dark:!text-blue-400",
    textAction: "focus:!text-blue-500 focus:dark:!text-blue-400 active:!text-blue-600 active:dark:!text-blue-300",
    textHover: "hover:!text-blue-500 hover:dark:!text-blue-400",
    icon: "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 bg-blue-400 dark:bg-blue-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 group-hover:bg-blue-400 group-hover:dark:bg-blue-500 !bg-opacity-40",
    border: "border-blue-500 dark:border-blue-400",
    borderHover: "hover:border-blue-500 hover:dark:border-blue-400",
    category: "Adapter",
    package: "trpc",
  },
  {
    label: "Firebase",
    description: "Connect to Firebase services for real-time data sync, authentication, and more backend features.",
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
    category: "Adapter",
    package: "firebase",
  },
  {
    label: "Firebase Admin",
    description: "Utilize the Firebase Admin SDK for privileged server-side access to your Firebase projects.",
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
    category: "Adapter",
    package: "firebase-admin",
  },
];
