/*
 * The backends, runtimes and frontend libraries Hyper Fetch works with, shown under the hero description. Each backend
 * is an adapter, a transport or a framework whose OpenAPI document the CLI turns into a typed SDK, and each logo links
 * to its docs.
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
    name: "NestJS",
    to: "/docs/integrations/nestjs/overview",
    src: "/img/integration-nest.svg",
  },
  {
    name: "Express",
    to: "/docs/integrations/express/overview",
    src: "/img/integration-express-dark.svg",
  },
  {
    name: "Fastify",
    to: "/docs/integrations/fastify/overview",
    src: "/img/integration-fastify-dark.svg",
  },
  {
    name: "FastAPI",
    to: "/docs/integrations/fastapi/overview",
    src: "/img/integration-fastapi.svg",
  },
  {
    name: "Django",
    to: "/docs/integrations/django/overview",
    src: "/img/integration-django-dark.svg",
  },
  {
    name: "Spring Boot",
    to: "/docs/integrations/spring-boot/overview",
    src: "/img/integration-spring.svg",
  },
  {
    name: "Node.js",
    to: "/docs/integrations/nodejs/overview",
    src: "/img/integration-node.svg",
  },
  {
    name: "Bun",
    to: "/docs/integrations/bun/overview",
    src: "/img/integration-bun.svg",
    scale: 1.1,
  },
  {
    name: "Deno",
    to: "/docs/integrations/deno/overview",
    src: "/img/integration-deno.svg",
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
  {
    name: "Next.js",
    to: "/docs/integrations/nextjs/overview",
    src: "/img/integration-next-dark.svg",
  },
  {
    name: "Astro",
    to: "/docs/integrations/astro/overview",
    src: "/img/integration-astro.svg",
  },
  {
    name: "TanStack Query",
    to: "/docs/integrations/tanstack-query/overview",
    src: "/img/integration-tanstack-query.svg",
  },
  {
    name: "SWR",
    to: "/docs/integrations/swr/overview",
    src: "/img/integration-swr-dark.svg",
  },
  {
    name: "React Router",
    to: "/docs/integrations/react-router/overview",
    src: "/img/integration-react-router-dark.svg",
  },
  {
    name: "TanStack Router",
    to: "/docs/integrations/tanstack-router/overview",
    src: "/img/integration-tanstack-dark.svg",
  },
  {
    name: "Electron",
    to: "/docs/integrations/electron/overview",
    src: "/img/integration-electron.svg",
  },
];
