import { useDidMount } from "@better-hooks/lifecycle";
import Head from "@docusaurus/Head";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import { Cookies } from "../cookies/cookies";
import { BetterTyped } from "./bettertyped/bettertyped";
import { CallToAction } from "./call-to-action/call-to-action";
import { Clients } from "./clients/clients";
import { Hero } from "./hero/hero";
import { Hub } from "./hub/hub";
import { Platforms } from "./platforms/platforms";
import { Problems } from "./problems/problems";
import { Production } from "./production/production";
import { Sdk } from "./sdk/sdk";
import { Sponsors } from "./sponsors/sponsors";
import { GoldGradient } from "./shared/gold-gradient";
import { WhatIs } from "./what-is/what-is";
import "./landing.css";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: "HyperFetch",
  description:
    "Type-safe data-exchange framework for HTTP, GraphQL, Firebase and realtime transports, with React hooks, caching, offline queues and websockets.",
  url: "https://hyperfetch.bettertyped.com/",
  codeRepository: "https://github.com/BetterTyped/hyper-fetch",
  programmingLanguage: "TypeScript",
  runtimePlatform: ["Browser", "Node.js"],
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  author: { "@type": "Organization", name: "BetterTyped", url: "https://bettertyped.com/" },
};

/*
 * Section order: hero · clients · what HyperFetch is (Core / Sockets / DB) · platforms ·
 * SDK from your code · BetterTyped · one typed client · ready for production · same bugs ·
 * sponsors · call to action.
 */
export const Landing = () => {
  const { siteConfig } = useDocusaurusContext();

  useDidMount(() => {
    window.scrollTo(0, 0);
  });

  return (
    <Layout title="Type-safe data fetching for TypeScript and React" description={siteConfig.tagline}>
      <Head>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <div className="landing-root relative z-10 w-[100vw] max-w-[100vw] overflow-x-hidden translate-y-[-88px]">
        <GoldGradient />
        <Hero />
        <div className="landing-scope">
          <Clients />
          <WhatIs />
          <Platforms />
        </div>
        <Sdk />
        <div className="landing-scope">
          <BetterTyped />
        </div>
        <Hub />
        <Production />
        <div className="landing-scope">
          <Problems />
          <Sponsors />
          <CallToAction />
        </div>
      </div>
      <Cookies />
    </Layout>
  );
};
