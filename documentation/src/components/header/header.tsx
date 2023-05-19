/* eslint-disable import/order */
import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";

import styles from "./header.module.css";
import "./animation.scss";

export function Header(): JSX.Element {
  return (
    <header className={clsx(styles.container)}>
      <a
        href="https://www.producthunt.com/posts/hyper-fetch?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-hyper&#0045;fetch"
        target="_blank"
        rel="noreferrer"
        className={styles.productHunt}
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=373208&theme=dark"
          alt="Hyper&#0032;Fetch - Framework&#0032;for&#0032;data&#0032;exchange&#0044;&#0032;async&#0032;state&#0032;management&#0032;and&#0032;more | Product Hunt"
          width="250"
          height="54"
        />
      </a>
      <div className={clsx(styles.glow, styles.glowFirst)} />
      <div className={clsx(styles.glow, styles.glowSecond)} />
      <div className={clsx(styles.glow, styles.glowThird)} />
      <div className={clsx("container", styles.wrapper)}>
        <div className={clsx(styles.logo)}>
          <img src="/img/brand/HF.svg" alt="" />
        </div>
        <h1 className={clsx(styles.tagline)}>
          Ultimate framework for <b className={clsx(styles.gradientLetters)}>requesting and realtime connection.</b>{" "}
        </h1>
        <div className={clsx(styles.addition)}>
          For any <span>Javascript / Typescript</span> environment like <span>Node.js</span>, <span>React</span>,{" "}
          <span>Angular</span>, <span>Svelte</span>, <span>Vue</span> and others.
        </div>

        <div className={styles.buttons}>
          <div className={styles.wrapper}>
            <div className={styles.glow} />
            <Link className="button button--primary button--lg" to="/docs/documentation/getting-started/overview">
              Get Started
            </Link>
          </div>
          <Link className="button button--secondary button--lg" to="/docs/guides/basic/setup">
            Guides →
          </Link>
        </div>
      </div>
      <div className="fireflies">
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
        <div className="firefly" />
      </div>
    </header>
  );
}
