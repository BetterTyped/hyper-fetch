import { useDidMount } from "@better-hooks/lifecycle";
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
    <Layout title="Seamless Requests and Real-Time Connectivity" description={siteConfig.tagline}>
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
