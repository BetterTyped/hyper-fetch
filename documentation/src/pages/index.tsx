import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import { Creators, Description, Features, Header, Promotion } from "../components";

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
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
