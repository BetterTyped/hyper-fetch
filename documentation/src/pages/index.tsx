import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import { Creators, Description, Features, Header, Promotion } from "../components";

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Header />
      <main>
        <Description />
        <Features />
        <Creators />
        <Promotion />
      </main>
    </Layout>
  );
}
