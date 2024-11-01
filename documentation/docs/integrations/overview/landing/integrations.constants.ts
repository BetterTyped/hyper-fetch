import { CardProps } from "./card/card";

export const integrations: Array<CardProps["item"]> = [
  {
    link: "/docs/integrations/codegen-openapi/introduction",
    img: "/img/integration-openapi.svg",
    name: "Codegen Openapi",
    featured: true,
    description:
      "Docusaurus is a great tool to create documentation. We've built the integration to fully automate documentation creation.",
    category: "Tool",
  },
  {
    link: "/docs/integrations/adapter-graphql/introduction",
    img: "/img/integration-graphql.svg",
    name: "Graphql",
    description: "We are fully compatible with Graphql by easy to use integration. It's easy to use and very powerful.",
    category: "Adapter",
  },
  {
    link: "/docs/integrations/adapter-firebase/introduction",
    img: "/img/integration-firebase.svg",
    name: "Firebase",
    description:
      "Firebase is yet another integration which is fully compatible with Reins. You can utilize it to make real-time apps.",
    category: "Service",
  },
  {
    link: "/docs/integrations/adapter-firebase-admin/introduction",
    img: "/img/integration-firebase.svg",
    name: "Firebase Admin",
    description:
      "Firebase is yet another integration which is fully compatible with Reins. You can utilize it to make real-time apps.",
    category: "Service",
  },
  {
    link: "/docs/integrations/adapter-axios/introduction",
    img: "/img/integration-axios.svg",
    name: "Axios",
    description: "Axios is a fully featured HTTP client for Node.js and the browser.",
    featured: true,
    category: "Adapter",
  },
];
