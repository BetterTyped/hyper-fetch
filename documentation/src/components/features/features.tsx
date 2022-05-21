/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";

import styles from "./features.module.css";

type FeatureItem = {
  image: string;
  description: string;
  link?: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    image: "/img/features/036-browser.svg",
    description: "Built-in http client",
    link: <Link to="/docs/Docs/Client">Read more</Link>,
  },
  {
    image: "/img/features/051-drive.svg",
    description: "Automatic caching",
    link: <Link to="/docs/Docs/Cache">Read more</Link>,
  },
  {
    image: "/img/features/029-find my gadget app.svg",
    description: "Rich Typescript support",
    link: <Link to="/docs/Getting%20Started/Typescript">Read more</Link>,
  },
  {
    image: "/img/features/038-like.svg",
    description: "Simple setup",
    link: <Link to="/docs/Getting Started/Quick Start">Read more</Link>,
  },
  {
    image: "/img/features/035-contacts.svg",
    description: "React hooks",
    link: <Link to="/docs/React/Overview">Read more</Link>,
  },
  {
    image: "/img/features/047-pin.svg",
    description: "Persistance",
    link: <Link to="/docs/Docs/Persistence">Read more</Link>,
  },
  {
    image: "/img/features/063-slide show app.svg",
    description: "Easy to test",
    link: <Link to="/docs/Docs/Testing">Read more</Link>,
  },
  {
    image: "/img/features/069-linkedin.svg",
    description: "App Managers",
    link: <Link to="/docs/Docs/Managers">Read more</Link>,
  },
  {
    image: "/img/features/049-messenger.svg",
    description: "React hooks with amazing features",
    link: <Link to="/docs/Docs/Managers">Read more</Link>,
  },
  {
    image: "/img/features/070-file hosting.svg",
    description: "Authentication solutions",
    link: <Link to="/examples/Authentication">Read more</Link>,
  },
  {
    image: "/img/features/012-daily health app.svg",
    description: "Queueing requests",
    link: <Link to="/examples/Authentication">Read more</Link>,
  },
  {
    image: "/img/features/002-speech bubble.svg",
    description: "Offline handling",
    link: <Link to="/docs/Docs/Offline">Read more</Link>,
  },
];

function Feature({ image, description, link }: FeatureItem) {
  return (
    <div className={clsx(styles.feature)}>
      <div className={styles.imageWrapper}>
        <img className={styles.featureSvg} alt={description} src={image} />
      </div>
      <div className={clsx(styles.details)}>
        <div className={styles.description}>{description}</div>
        {link}
      </div>
    </div>
  );
}

export function Features(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className="page-section-title">Features</h2>
        <div className={styles.list}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
