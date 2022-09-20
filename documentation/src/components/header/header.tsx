/* eslint-disable import/order */
import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import styles from "./header.module.css";
import "./animation.scss";

export function Header(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx(styles.container)}>
      <div className={clsx("container", styles.wrapper)}>
        <h2 className={clsx(styles.title)}>
          <div className={clsx(styles.projectName)}>{siteConfig.projectName}</div>
          <div className={clsx(styles.stars)}>
            <a href="https://github.com/BetterTyped/hyper-fetch" target="_blank" rel="noreferrer">
              <img
                src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&label=Stars&maxAge=2592000&logo=github&logoColor=white&labelColor=272c32&color=0d1117"
                alt=""
              />
            </a>
          </div>
        </h2>
        <h3 className={clsx(styles.tagline)}>
          Ultimate framework for{" "}
          <b className={clsx(styles.gradientLetters)}>
            data exchange, asynchronous state management, complex persistance and queueing.
          </b>{" "}
        </h3>
        <div className={clsx(styles.addition)}>
          For any <span>Javascript / Typescript</span> environment like <span>React</span>, <span>Angular</span>,{" "}
          <span>Svelte</span>, <span>Vue</span> and others.
        </div>

        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/Getting Started/Overview">
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" to="/guides/Basic/Dispatching">
            Guides
          </Link>
        </div>
      </div>
      <div className={styles.animation}>
        <svg
          className={styles.waves}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1260 214.5"
          preserveAspectRatio="xMin meet"
        >
          <defs>
            <linearGradient id="a">
              <stop stopColor="var(--ifm-color-primary-dark)" />
              <stop offset="0.2" stopColor="var(--ifm-color-warning-dark)" />
              <stop offset="0.4" stopColor="var(--ifm-color-primary-dark)" />
              <stop offset="0.6" stopColor="var(--ifm-color-primary)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#a)"
            d="M2662.6 1S2532 41.2 2435 40.2c-19.6-.2-37.3-1.3-53.5-2.8 0 0-421.3-59.4-541-28.6-119.8 30.6-206.2 75.7-391 73.3-198.8-2-225.3-15-370.2-50-145-35-218 37-373.3 36-19.6 0-37.5-1-53.7-3 0 0-282.7-36-373.4-38C139 26 75 46-1 46v106c17-1.4 20-2.3 37.6-1.2 130.6 8.4 210 56.3 287 62.4 77 6 262-25 329.3-23.6 67 1.4 107 22.6 193 23.4 155 1.5 249-71 380-62.5 130 8.5 209 56.3 287 62.5 77 6 126-18 188-18 61.4 0 247-38 307.4-46 159.3-20 281.2 29 348.4 30 67 2 132.2 6 217.4 7 39.3 0 87-11 87-11V1z"
          />
          <path
            fill="var(--section-background)"
            opacity="0.6"
            d="M2663.6 73.2S2577 92 2529 89c-130.7-8.5-209.5-56.3-286.7-62.4s-125.7 18-188.3 18c-5 0-10-.4-14.5-.7-52-5-149.2-43-220.7-39-31.7 2-64 14-96.4 30-160.4 80-230.2-5.6-340.4-18-110-12-146.6 20-274 36S820.4 0 605.8 0C450.8 0 356 71 225.2 62.2 128 56 60.7 28-.3 11.2V104c22 7.3 46 14.2 70.4 16.7 110 12.3 147-19.3 275-35.5s350 39.8 369 43c27 4.3 59 8 94 10 13 .5 26 1 39 1 156 2 250-70.3 381-62 130.5 8.2 209.5 56.3 286.7 62 77 6.4 125.8-18 188.3-17.5 5 0 10 .2 14.3.6 52 5 145 49.5 220.7 38.2 32-5 64-15 96.6-31 160.5-79.4 230.3 6 340 18.4 110 12 146.3-20 273.7-36l15.5-2V73l1-.5z"
          />
        </svg>
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
