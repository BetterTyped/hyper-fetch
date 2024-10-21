import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { Header } from "./header/header";
import { Description } from "./description/description";
import { Preview } from "./preview/preview";
import { Partners } from "./partners/partners";
import { Promotion } from "./promotion/promotion";

export function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const title = "Data Fetching, Offline First, Caching, Queueing";
  return (
    <Layout title={title} description={siteConfig.tagline}>
      <Header />
      <main>
        <Description />
        {/* <Features /> */}
        <Preview />
        <Partners />
        <Promotion />
      </main>
    </Layout>
  );
}
