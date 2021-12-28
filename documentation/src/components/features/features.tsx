/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import clsx from "clsx";

import styles from "./features.module.css";

type FeatureItem = {
  image: string;
  description: string;
};

const FeatureList: FeatureItem[] = [
  {
    image: "/img/business/001-affiliate.svg",
    description: "Easy-to-use",
  },
  {
    image: "/img/business/001-affiliate.svg",
    description: "Offline & Persistence",
  },
  {
    image: "/img/business/001-affiliate.svg",
    description: "Extend or customize",
  },
  {
    image: "/img/business/001-affiliate.svg",
    description: "Extend or customize",
  },
  {
    image: "/img/business/001-affiliate.svg",
    description: "Extend or customize",
  },
  {
    image: "/img/business/001-affiliate.svg",
    description: "Extend or customize",
  },
];

function Feature({ image, description }: FeatureItem) {
  return (
    <div className={clsx(styles.feature)}>
      <div className={styles.imageWrapper}>
        <img className={styles.featureSvg} alt={description} src={image} />
      </div>
      <h4 className={styles.description}>{description}</h4>
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
