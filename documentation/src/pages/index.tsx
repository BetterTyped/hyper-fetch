import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import { Description, Features, Header, Promotion, Partners, Preview } from "../components";

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.projectName} description={siteConfig.tagline}>
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
