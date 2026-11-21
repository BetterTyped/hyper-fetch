/*
 * The backends and runtimes Hyper Fetch works with, shown under the hero description. Each backend is an adapter or a
 * transport that keeps the same createRequest() and send() calls, and each logo links to its docs.
 */
export const backends: {
  name: string;
  src: string;
  to: string;
  scale?: number;
}[] = [
  {
    name: "OpenAPI",
    to: "/docs/cli/commands/generate",
    src: "/img/integration-openapi.svg",
    scale: 1.35,
  },
  {
    name: "GraphQL",
    to: "/docs/integrations/adapter-graphql/overview",
    src: "/img/integration-graphql.svg",
  },
  {
    name: "tRPC",
    to: "/docs/integrations/adapter-trpc/overview",
    src: "/img/integration-trpc.svg",
    scale: 1.12,
  },
  {
    name: "oRPC",
    to: "/docs/integrations/adapter-orpc/overview",
    src: "/img/integration-orpc-dark.svg",
  },
  {
    name: "Hono",
    to: "/docs/integrations/hono/overview",
    src: "/img/integration-hono.svg",
  },
  {
    name: "Elysia",
    to: "/docs/integrations/elysia/overview",
    src: "/img/integration-elysia.svg",
  },
  {
    name: "Node.js",
    to: "/docs/getting-started/installation",
    src: "/img/integration-node.svg",
  },
  {
    name: "Bun",
    to: "/docs/getting-started/installation",
    src: "/img/integration-bun.svg",
    scale: 1.1,
  },
  {
    name: "Firebase",
    to: "/docs/integrations/adapter-firebase/overview",
    src: "/img/integration-firebase.svg",
  },
  {
    name: "Axios",
    to: "/docs/integrations/adapter-axios/overview",
    src: "/img/integration-axios.svg",
  },
  {
    name: "WebSockets",
    to: "/docs/sockets/overview",
    src: "/img/integration-sockets.svg",
  },
  {
    name: "React",
    to: "/docs/react/overview",
    src: "/img/integration-react.svg",
  },
];
