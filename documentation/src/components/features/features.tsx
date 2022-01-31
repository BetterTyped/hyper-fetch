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
    description: "Lightweight ultimate fetching solution",
  },
  {
    image: "/img/features/051-drive.svg",
    description: "Offline & Persistence(Optional) for Queues and Cache",
    link: <Link to="/docs/Docs/Cache">Docs</Link>,
  },
  {
    image: "/img/features/029-find my gadget app.svg",
    description: "Typescript ready",
  },
  {
    image: "/img/features/038-like.svg",
    description: "Pagination and Infinity scroll",
  },
  {
    image: "/img/features/035-contacts.svg",
    description: "Simple setup, a LOT to configure and extend",
    link: <Link to="/docs/Getting Started/Quick Start">Quick Start</Link>,
  },
  {
    image: "/img/features/047-pin.svg",
    description: "Backend agnostic",
    link: <Link to="/docs/Docs/Client">Docs for Client</Link>,
  },
  {
    image: "/img/features/063-slide show app.svg",
    description: "Support for native, browser and SSR",
  },
  {
    image: "/img/features/069-linkedin.svg",
    description: "Offline and Focus Manager",
  },
  {
    image: "/img/features/049-messenger.svg",
    description: "React hooks with amazing features",
    link: <Link to="/docs/React/Overview">Docs for React</Link>,
  },
  {
    image: "/img/features/070-file hosting.svg",
    description: "Prefetching, Pooling, realtime, auto cache and scroll recovery",
  },
  {
    image: "/img/features/012-daily health app.svg",
    description: "Easy request download/upload tracking",
  },
  {
    image: "/img/features/002-speech bubble.svg",
    description: "Optimistic approach mutations",
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
