import { useDidMount } from "@better-hooks/lifecycle";
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
import { WhatIs } from "./what-is/what-is";
import "./landing.css";

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
    <Layout
      title="Fetch anything. Type everything."
      description={siteConfig.tagline}
    >
      <div className="landing-root relative z-10 w-[100vw] max-w-[100vw] overflow-x-hidden translate-y-[-88px]">
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
