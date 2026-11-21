import { useDidMount } from "@better-hooks/lifecycle";
import Head from "@docusaurus/Head";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useWindowEvent } from "@site/src/hooks/use-window-event";
import Layout from "@theme/Layout";
import { useState } from "react";

import { Cookies } from "../cookies/cookies";
import { About } from "./about/about";
import { Blocks } from "./blocks";
import { CallToAction } from "./call-to-action";
import { Clients } from "./clients";
import { CodePreview } from "./code/code";
// import { Integrations } from "./integrations/integrations";
import { Features } from "./features/features";
import { Hero } from "./hero";
import { Hub } from "./hub/hub";
import { Modules } from "./modules/modules";
// import { Example } from "./example/example";
import { Preview } from "./preview/preview";
import { Sponsors } from "./sponsors/sponsors";

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

export const Landing = () => {
  const { siteConfig } = useDocusaurusContext();

  const [hide, setHide] = useState(false);

  useDidMount(() => {
    window.scrollTo(0, 0);
  });

  useWindowEvent(
    "scroll",
    () => {
      const hideValue = window.scrollY > window.innerHeight * 2;

      if (hide !== hideValue) {
        setHide(hideValue);
      }
    },
    [hide],
  );

  return (
    <Layout title="Type-safe data fetching for TypeScript and React" description={siteConfig.tagline}>
      <Head>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <div className="relative z-10 w-[100vw] max-w-[100vw] overflow-x-hidden translate-y-[-88px]">
        <Hero />
        <CodePreview />
        <Clients />
        <About />
        <Features />
        <Hub />
        <Preview />
        <Modules />
        <Blocks />
        {/* <Integrations /> */}
        {/* <Example /> */}
        <Sponsors />
        <CallToAction />
      </div>
      <Cookies />
    </Layout>
  );
};
