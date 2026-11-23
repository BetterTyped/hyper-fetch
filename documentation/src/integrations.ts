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
// Third-party logos, see static/img/ATTRIBUTION.md
const NestIcon = isBrowser() ? require("../static/img/integration-nest.svg").default : () => null;
const ExpressIcon = isBrowser() ? require("../static/img/integration-express.svg").default : () => null;
const FastifyIcon = isBrowser() ? require("../static/img/integration-fastify.svg").default : () => null;
const FastApiIcon = isBrowser() ? require("../static/img/integration-fastapi.svg").default : () => null;
const DjangoIcon = isBrowser() ? require("../static/img/integration-django.svg").default : () => null;
const SpringIcon = isBrowser() ? require("../static/img/integration-spring.svg").default : () => null;
const DotnetIcon = isBrowser() ? require("../static/img/integration-dotnet.svg").default : () => null;
const LaravelIcon = isBrowser() ? require("../static/img/integration-laravel.svg").default : () => null;
const RailsIcon = isBrowser() ? require("../static/img/integration-rails.svg").default : () => null;
const NodeIcon = isBrowser() ? require("../static/img/integration-node.svg").default : () => null;
const BunIcon = isBrowser() ? require("../static/img/integration-bun.svg").default : () => null;
const DenoIcon = isBrowser() ? require("../static/img/integration-deno.svg").default : () => null;
const CloudflareIcon = isBrowser() ? require("../static/img/integration-cloudflare-workers.svg").default : () => null;
const ReactIcon = isBrowser() ? require("../static/img/integration-react.svg").default : () => null;
const ElectronIcon = isBrowser() ? require("../static/img/integration-electron.svg").default : () => null;
const SentryIcon = isBrowser() ? require("../static/img/integration-sentry.svg").default : () => null;

/**
 * Colors of the sections that are not packages. The class names are written out in full so Tailwind finds them.
 * `light` puts dark logos (Express, Fastify, Django, Deno) on a light tile in both themes.
 */
const palette = {
  red: {
    text: "drop-shadow-sm !text-red-500 dark:!text-red-400",
    textAction: "focus:!text-red-500 focus:dark:!text-red-400 active:!text-red-600 active:dark:!text-red-300",
    textHover: "hover:!text-red-500 hover:dark:!text-red-400",
    icon: "group-hover:shadow-red-200 dark:group-hover:bg-red-500 bg-red-400 dark:bg-red-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-red-200 dark:group-hover:bg-red-500 group-hover:bg-red-400 group-hover:dark:bg-red-500 !bg-opacity-40",
    border: "border-red-500 dark:border-red-400",
    borderHover: "hover:border-red-500 hover:dark:border-red-400",
  },
  green: {
    text: "drop-shadow-sm !text-green-500 dark:!text-green-400",
    textAction: "focus:!text-green-500 focus:dark:!text-green-400 active:!text-green-600 active:dark:!text-green-300",
    textHover: "hover:!text-green-500 hover:dark:!text-green-400",
    icon: "group-hover:shadow-green-200 dark:group-hover:bg-green-500 bg-green-400 dark:bg-green-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-green-200 dark:group-hover:bg-green-500 group-hover:bg-green-400 group-hover:dark:bg-green-500 !bg-opacity-40",
    border: "border-green-500 dark:border-green-400",
    borderHover: "hover:border-green-500 hover:dark:border-green-400",
  },
  teal: {
    text: "drop-shadow-sm !text-teal-500 dark:!text-teal-400",
    textAction: "focus:!text-teal-500 focus:dark:!text-teal-400 active:!text-teal-600 active:dark:!text-teal-300",
    textHover: "hover:!text-teal-500 hover:dark:!text-teal-400",
    icon: "group-hover:shadow-teal-200 dark:group-hover:bg-teal-500 bg-teal-400 dark:bg-teal-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-teal-200 dark:group-hover:bg-teal-500 group-hover:bg-teal-400 group-hover:dark:bg-teal-500 !bg-opacity-40",
    border: "border-teal-500 dark:border-teal-400",
    borderHover: "hover:border-teal-500 hover:dark:border-teal-400",
  },
  emerald: {
    text: "drop-shadow-sm !text-emerald-600 dark:!text-emerald-400",
    textAction:
      "focus:!text-emerald-600 focus:dark:!text-emerald-400 active:!text-emerald-700 active:dark:!text-emerald-300",
    textHover: "hover:!text-emerald-600 hover:dark:!text-emerald-400",
    icon: "bg-zinc-100 dark:bg-zinc-200",
    iconHover: "group-hover:bg-white group-hover:dark:bg-white",
    border: "border-emerald-600 dark:border-emerald-400",
    borderHover: "hover:border-emerald-600 hover:dark:border-emerald-400",
  },
  violet: {
    text: "drop-shadow-sm !text-violet-500 dark:!text-violet-400",
    textAction:
      "focus:!text-violet-500 focus:dark:!text-violet-400 active:!text-violet-600 active:dark:!text-violet-300",
    textHover: "hover:!text-violet-500 hover:dark:!text-violet-400",
    icon: "group-hover:shadow-violet-200 dark:group-hover:bg-violet-500 bg-violet-400 dark:bg-violet-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-violet-200 dark:group-hover:bg-violet-500 group-hover:bg-violet-400 group-hover:dark:bg-violet-500 !bg-opacity-40",
    border: "border-violet-500 dark:border-violet-400",
    borderHover: "hover:border-violet-500 hover:dark:border-violet-400",
  },
  amber: {
    text: "drop-shadow-sm !text-amber-500 dark:!text-amber-300",
    textAction: "focus:!text-amber-500 focus:dark:!text-amber-300 active:!text-amber-600 active:dark:!text-amber-200",
    textHover: "hover:!text-amber-500 hover:dark:!text-amber-300",
    icon: "group-hover:shadow-amber-200 dark:group-hover:bg-amber-300 bg-amber-300 dark:bg-amber-300 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-amber-200 dark:group-hover:bg-amber-300 group-hover:bg-amber-300 group-hover:dark:bg-amber-300 !bg-opacity-40",
    border: "border-amber-500 dark:border-amber-300",
    borderHover: "hover:border-amber-500 hover:dark:border-amber-300",
  },
  orange: {
    text: "drop-shadow-sm !text-orange-500 dark:!text-orange-400",
    textAction:
      "focus:!text-orange-500 focus:dark:!text-orange-400 active:!text-orange-600 active:dark:!text-orange-300",
    textHover: "hover:!text-orange-500 hover:dark:!text-orange-400",
    icon: "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 bg-orange-400 dark:bg-orange-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 group-hover:bg-orange-400 group-hover:dark:bg-orange-500 !bg-opacity-40",
    border: "border-orange-500 dark:border-orange-400",
    borderHover: "hover:border-orange-500 hover:dark:border-orange-400",
  },
  sky: {
    text: "drop-shadow-sm !text-sky-500 dark:!text-sky-400",
    textAction: "focus:!text-sky-500 focus:dark:!text-sky-400 active:!text-sky-600 active:dark:!text-sky-300",
    textHover: "hover:!text-sky-500 hover:dark:!text-sky-400",
    icon: "group-hover:shadow-sky-200 dark:group-hover:bg-sky-500 bg-sky-400 dark:bg-sky-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-sky-200 dark:group-hover:bg-sky-500 group-hover:bg-sky-400 group-hover:dark:bg-sky-500 !bg-opacity-40",
    border: "border-sky-500 dark:border-sky-400",
    borderHover: "hover:border-sky-500 hover:dark:border-sky-400",
  },
  cyan: {
    text: "drop-shadow-sm !text-cyan-600 dark:!text-cyan-400",
    textAction: "focus:!text-cyan-600 focus:dark:!text-cyan-400 active:!text-cyan-700 active:dark:!text-cyan-300",
    textHover: "hover:!text-cyan-600 hover:dark:!text-cyan-400",
    icon: "group-hover:shadow-cyan-200 dark:group-hover:bg-cyan-500 bg-cyan-400 dark:bg-cyan-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-cyan-200 dark:group-hover:bg-cyan-500 group-hover:bg-cyan-400 group-hover:dark:bg-cyan-500 !bg-opacity-40",
    border: "border-cyan-600 dark:border-cyan-400",
    borderHover: "hover:border-cyan-600 hover:dark:border-cyan-400",
  },
  pink: {
    text: "drop-shadow-sm !text-pink-500 dark:!text-pink-400",
    textAction: "focus:!text-pink-500 focus:dark:!text-pink-400 active:!text-pink-600 active:dark:!text-pink-300",
    textHover: "hover:!text-pink-500 hover:dark:!text-pink-400",
    icon: "group-hover:shadow-pink-200 dark:group-hover:bg-pink-500 bg-pink-400 dark:bg-pink-500 !bg-opacity-30",
    iconHover:
      "group-hover:shadow-pink-200 dark:group-hover:bg-pink-500 group-hover:bg-pink-400 group-hover:dark:bg-pink-500 !bg-opacity-40",
    border: "border-pink-500 dark:border-pink-400",
    borderHover: "hover:border-pink-500 hover:dark:border-pink-400",
  },
  zinc: {
    text: "drop-shadow-sm !text-zinc-600 dark:!text-zinc-200",
    textAction: "focus:!text-zinc-600 focus:dark:!text-zinc-200 active:!text-zinc-700 active:dark:!text-zinc-100",
    textHover: "hover:!text-zinc-600 hover:dark:!text-zinc-100",
    icon: "bg-zinc-100 dark:bg-zinc-200",
    iconHover: "group-hover:bg-white group-hover:dark:bg-white",
    border: "border-zinc-600 dark:border-zinc-200",
    borderHover: "hover:border-zinc-600 hover:dark:border-zinc-100",
  },
} satisfies Record<
  string,
  Pick<Section, "text" | "textAction" | "textHover" | "icon" | "iconHover" | "border" | "borderHover">
>;

/**
 * A framework, runtime or tool that works with HyperFetch without a package of its own. Its pages explain how to
 * connect it, usually through the OpenAPI document and the CLI.
 */
const guideSection = (
  section: Pick<Section, "label" | "description" | "dir" | "img" | "category"> & { color: keyof typeof palette },
): Section => {
  const { color, ...rest } = section;
  return { ...rest, ...palette[color], paths: [section.dir], isPackage: false };
};

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
  guideSection({
    label: "NestJS",
    description: "Generate a typed SDK from the OpenAPI document that @nestjs/swagger builds from your controllers.",
    dir: "nestjs",
    img: NestIcon,
    category: "Framework",
    color: "red",
  }),
  guideSection({
    label: "Express",
    description: "Describe your Express routes with OpenAPI and call them through a generated, typed SDK.",
    dir: "express",
    img: ExpressIcon,
    category: "Framework",
    color: "zinc",
  }),
  guideSection({
    label: "Fastify",
    description: "Turn the JSON schemas on your Fastify routes into an OpenAPI document and a typed SDK.",
    dir: "fastify",
    img: FastifyIcon,
    category: "Framework",
    color: "zinc",
  }),
  guideSection({
    label: "FastAPI",
    description: "Generate a typed TypeScript SDK from the openapi.json that FastAPI serves out of the box.",
    dir: "fastapi",
    img: FastApiIcon,
    category: "Framework",
    color: "teal",
  }),
  guideSection({
    label: "Django",
    description: "Export your Django REST Framework schema with drf-spectacular and call it through a typed SDK.",
    dir: "django",
    img: DjangoIcon,
    category: "Framework",
    color: "emerald",
  }),
  guideSection({
    label: "Spring Boot",
    description: "Generate a typed SDK from the OpenAPI document springdoc-openapi serves for your controllers.",
    dir: "spring-boot",
    img: SpringIcon,
    category: "Framework",
    color: "green",
  }),
  guideSection({
    label: "ASP.NET Core",
    description: "Generate a typed SDK from the OpenAPI document that ASP.NET Core builds for your endpoints.",
    dir: "aspnet-core",
    img: DotnetIcon,
    category: "Framework",
    color: "violet",
  }),
  guideSection({
    label: "Laravel",
    description: "Generate a typed SDK from the OpenAPI document Scramble builds from your Laravel routes.",
    dir: "laravel",
    img: LaravelIcon,
    category: "Framework",
    color: "red",
  }),
  guideSection({
    label: "Ruby on Rails",
    description: "Write the OpenAPI document from your rswag specs and call your Rails API through a typed SDK.",
    dir: "rails",
    img: RailsIcon,
    category: "Framework",
    color: "red",
  }),
  guideSection({
    label: "Node.js",
    description: "Run HyperFetch on the server with the fetch built into Node.js. No polyfills, no extra adapter.",
    dir: "nodejs",
    img: NodeIcon,
    category: "Runtime",
    color: "green",
  }),
  guideSection({
    label: "Bun",
    description: "Install HyperFetch with bun add and run it on Bun's native fetch, in scripts, servers and tests.",
    dir: "bun",
    img: BunIcon,
    category: "Runtime",
    color: "amber",
  }),
  guideSection({
    label: "Deno",
    description: "Import HyperFetch with an npm: specifier and run it on Deno and Deno Deploy.",
    dir: "deno",
    img: DenoIcon,
    category: "Runtime",
    color: "zinc",
  }),
  guideSection({
    label: "Cloudflare Workers",
    description: "Call your APIs from Workers and other edge runtimes, with a client scoped to each request.",
    dir: "cloudflare-workers",
    img: CloudflareIcon,
    category: "Runtime",
    color: "orange",
  }),
  guideSection({
    label: "React Native",
    description: "Use HyperFetch and its React hooks in React Native, with focus and network state from the device.",
    dir: "react-native",
    img: ReactIcon,
    category: "Native",
    color: "sky",
  }),
  guideSection({
    label: "Electron",
    description: "Fetch from the renderer like a web app, or from the main process on Node.js, with one client setup.",
    dir: "electron",
    img: ElectronIcon,
    category: "Native",
    color: "cyan",
  }),
  guideSection({
    label: "Sentry",
    description: "Report failed requests to Sentry with client interceptors, next to its own fetch tracing.",
    dir: "sentry",
    img: SentryIcon,
    category: "Monitoring",
    color: "pink",
  }),
];
