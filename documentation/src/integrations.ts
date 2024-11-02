import { Book } from "lucide-react";
import AxiosIcon from "@site/static/img/integration-axios.svg";
// import ReactIcon from "@site/static/img/integration-react.svg";
// import NextIcon from "@site/static/img/integration-next.svg";
// import RemixIcon from "@site/static/img/integration-remix.svg";
// import AstroIcon from "@site/static/img/integration-astro.svg";
// import NestIcon from "@site/static/img/integration-nest.svg";
import GraphqlIcon from "@site/static/img/integration-graphql.svg";
// import RestIcon from "@site/static/img/integration-rest.svg";
// import StrapiIcon from "@site/static/img/integration-strapi.svg";
// import HasuraIcon from "@site/static/img/integration-hasura.svg";
// import AppwriteIcon from "@site/static/img/integration-appwrite.svg";
// import AirtableIcon from "@site/static/img/integration-airtable.svg";
// import MedusaIcon from "@site/static/img/integration-medusa.svg";
import FirebaseIcon from "@site/static/img/integration-firebase.svg";
// import SocketsIcon from "@site/static/img/integration-sockets.svg";
// import KindeIcon from "@site/static/img/integration-kinde.svg";
// import ClerkIcon from "@site/static/img/integration-clerk.svg";
// import MapboxIcon from "@site/static/img/integration-mapbox.svg";
// import GoogleMapsIcon from "@site/static/img/integration-google-maps.svg";
import OpenApiIcon from "@site/static/img/integration-openapi.svg";

import { Section } from "./modules";

export const integrations: Section[] = [
  {
    label: "Overview",
    description: "",
    isPackage: false,
    dir: "overview",
    names: ["overview"],
    img: Book,
    text: "drop-shadow-sm !text-yellow-500 dark:!text-yellow-400",
    textAction:
      "focus:!text-yellow-500 focus:dark:!text-yellow-400 active:!text-yellow-600 active:dark:!text-yellow-300",
    textHover: "hover:!text-yellow-500 hover:dark:!text-yellow-400",
    icon: "group-hover:shadow-yellow-200 dark:group-hover:bg-yellow-500 bg-yellow-400 dark:bg-yellow-500",
    iconHover:
      "hover:group-hover:shadow-yellow-200 hover:dark:group-hover:bg-yellow-500 hover:bg-yellow-400 hover:dark:bg-yellow-500",
    border: "border-yellow-500 dark:border-yellow-400",
    borderHover: "hover:border-yellow-500 hover:dark:border-yellow-400",
  },
  {
    label: "Axios",
    description: "",
    dir: "adapter-axios",
    isPackage: true,
    names: ["axios", "adapter-axios"],
    img: AxiosIcon,
    text: "drop-shadow-sm !text-blue-500 dark:!text-blue-400",
    textAction: "focus:!text-blue-500 focus:dark:!text-blue-400 active:!text-blue-600 active:dark:!text-blue-300",
    textHover: "hover:!text-blue-500 hover:dark:!text-blue-400",
    icon: "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 bg-blue-400 dark:bg-blue-500",
    iconHover:
      "group-hover:shadow-blue-200 dark:group-hover:bg-blue-500 group-hover:bg-blue-400 group-hover:dark:bg-blue-500",
    border: "border-blue-500 dark:border-blue-400",
    borderHover: "hover:border-blue-500 hover:dark:border-blue-400",
  },
  {
    label: "Graphql",
    description: "",
    dir: "adapter-graphql",
    isPackage: true,
    names: ["graphql", "adapter-graphql"],
    img: GraphqlIcon,
    text: "drop-shadow-sm !text-purple-500 dark:!text-pink-400",
    textAction: "focus:!text-pink-500 focus:dark:!text-pink-400 active:!text-pink-600 active:dark:!text-pink-300",
    textHover: "hover:!text-pink-500 hover:dark:!text-pink-400",
    icon: "group-hover:shadow-pink-200 dark:group-hover:bg-pink-500 bg-pink-400 dark:bg-pink-500",
    iconHover:
      "group-hover:shadow-pink-200 dark:group-hover:bg-pink-500 group-hover:bg-pink-400 group-hover:dark:bg-pink-500",
    border: "border-pink-500 dark:border-pink-400",
    borderHover: "hover:border-pink-500 hover:dark:border-pink-400",
  },
  {
    label: "Firebase",
    description: "",
    dir: "adapter-firebase",
    isPackage: true,
    names: ["firebase", "adapter-firebase"],
    img: FirebaseIcon,
    text: "drop-shadow-sm !text-orange-500 dark:!text-orange-400",
    textAction:
      "focus:!text-orange-500 focus:dark:!text-orange-400 active:!text-orange-600 active:dark:!text-orange-300",
    textHover: "hover:!text-orange-500 hover:dark:!text-orange-400",
    icon: "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 bg-orange-400 dark:bg-orange-500",
    iconHover:
      "group-hover:shadow-orange-200 dark:group-hover:bg-orange-500 group-hover:bg-orange-400 group-hover:dark:bg-orange-500",
    border: "border-orange-500 dark:border-orange-400",
    borderHover: "hover:border-orange-500 hover:dark:border-orange-400",
  },
  {
    label: "Firebase Admin",
    description: "",
    dir: "adapter-firebase-admin",
    isPackage: true,
    names: ["firebase-admin", "adapter-firebase-admin"],
    img: FirebaseIcon,
    text: "drop-shadow-sm !text-red-500 dark:!text-red-400",
    textAction: "focus:!text-red-500 focus:dark:!text-red-400 active:!text-red-600 active:dark:!text-red-300",
    textHover: "hover:!text-red-500 hover:dark:!text-red-400",
    icon: "group-hover:shadow-red-200 dark:group-hover:bg-red-500 bg-red-400 dark:bg-red-500",
    iconHover:
      "group-hover:shadow-red-200 dark:group-hover:bg-red-500 group-hover:bg-red-400 group-hover:dark:bg-red-500",
    border: "border-red-500 dark:border-red-400",
    borderHover: "hover:border-red-500 hover:dark:border-red-400",
  },
  {
    label: "Codegen Openapi",
    description: "",
    dir: "codegen-openapi",
    isPackage: true,
    names: ["swagger", "codegen-openapi"],
    img: OpenApiIcon,
    text: "drop-shadow-sm !text-lime-500 dark:!text-lime-400",
    textAction: "focus:!text-lime-500 focus:dark:!text-lime-400 active:!text-lime-600 active:dark:!text-lime-300",
    textHover: "hover:!text-lime-500 hover:dark:!text-lime-400",
    icon: "group-hover:shadow-lime-200 dark:group-hover:bg-lime-500 bg-lime-400 dark:bg-lime-500",
    iconHover:
      "group-hover:shadow-lime-200 dark:group-hover:bg-lime-500 group-hover:bg-lime-400 group-hover:dark:bg-lime-500",
    border: "border-lime-500 dark:border-lime-400",
    borderHover: "hover:border-lime-500 hover:dark:border-lime-400",
  },
];
