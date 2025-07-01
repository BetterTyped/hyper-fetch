import { useState } from "react";
import { useDidMount } from "@better-hooks/lifecycle";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import { useWindowEvent } from "@site/src/hooks/use-window-event";

import { Hero } from "./hero";
import { Clients } from "./clients";
import { Blocks } from "./blocks";
import { CallToAction } from "./call-to-action";
import { Modules } from "./modules/modules";
// import { Integrations } from "./integrations/integrations";
import { Features } from "./features/features";
// import { Example } from "./example/example";
import { Preview } from "./preview/preview";
import { Sponsors } from "./sponsors/sponsors";
import { About } from "./about/about";

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
        <Clients />
        <About />
        <Preview />
        <Modules />
        <Features />
        {/* <Integrations /> */}
        <Blocks />
        {/* <Example /> */}
        <Sponsors />
        <CallToAction />
      </div>
    </Layout>
  );
};
