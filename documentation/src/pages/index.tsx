import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import { Description, Features, Header, Promotion, Partners, Preview } from "../components";

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const title = "Data Fetching, Offline First, Caching, Queueing";
  return (
    <Layout title={title} description={siteConfig.tagline}>
      <Header />
      <main>
        <Description />
        <Features />
        <Preview />
        <Partners />
        <Promotion />
      </main>
    </Layout>
  );
}
