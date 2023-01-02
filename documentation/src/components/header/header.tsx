/* eslint-disable import/order */
import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useFetch } from "@hyper-fetch/react";
import CountUp from "react-countup";

import styles from "./header.module.css";
import "./animation.scss";
import { getRepository } from "@site/src/api";

const request = getRepository.setParams({ account: "BetterTyped", repository: "hyper-fetch" });

export function Header(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const { data } = useFetch(request, { revalidateOnMount: false });

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
      <div className={clsx("container", styles.wrapper)}>
        <h2 className={clsx(styles.title)}>
          <div className={clsx(styles.projectName)}>{siteConfig.projectName}</div>
          <div className={clsx(styles.stars, { [styles.full]: !!data })}>
            <a
              href="https://github.com/BetterTyped/hyper-fetch"
              target="_blank"
              rel="noreferrer"
              className={clsx(styles.githubStars)}
            >
              <svg enableBackground="new 0 0 32 32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <g id="Layer_25">
                  <path
                    d="m13.889 3.885-3.05 6.18-6.82.991c-1.931.281-2.702 2.654-1.305 4.016l4.935 4.81-1.165 6.792c-.33 1.923 1.689 3.39 3.416 2.482l6.1-3.206 6.1 3.207c1.727.908 3.746-.559 3.416-2.482l-1.165-6.792 4.935-4.81c1.397-1.362.626-3.736-1.305-4.016l-6.82-.991-3.05-6.18c-.863-1.751-3.359-1.751-4.222-.001z"
                    fill="#ffd731"
                  />
                  <g fill="#ffce00">
                    <path d="m29.29 15.07-4.94 4.81-5.33-1.74c.27-.85.7-1.65 1.26-2.36l9.6-3.11c.26.8.1 1.72-.59 2.4z" />
                    <path d="m24.57 28.99c-.67.49-1.61.62-2.47.17l-6.1-3.21v-5.62c.9 0 1.79.17 2.64.48z" />
                    <path d="m13.38 20.8-5.96 8.18c-.68-.49-1.1-1.34-.94-2.3l1.17-6.79 5.33-1.74c.29.85.42 1.75.37 2.66.01 0 .02-.01.03-.01z" />
                    <path d="m14.14 14.61c-.72.53-1.54.93-2.42 1.17l-9.6-3.12c.26-.8.94-1.46 1.9-1.6l6.82-.99z" />
                    <path d="m21.16 10.06-3.29 4.56c-.72-.53-1.36-1.19-1.87-1.95v-10.1c.84 0 1.68.44 2.11 1.32z" />
                  </g>
                  <path
                    d="m14.666 5.704c-.182-.091-.409-.017-.502.17l-1.157 2.34c-.092.186-.016.41.17.502.053.026.11.039.166.039.138 0 .271-.076.336-.209l1.157-2.34c.092-.185.016-.41-.17-.502z"
                    fill="#ffe576"
                  />
                  <path
                    d="m12.916 9.247c-.185-.09-.41-.018-.503.169l-.166.335c-.092.186-.017.411.169.503.054.026.11.039.167.039.138 0 .271-.076.336-.208l.166-.335c.092-.186.017-.411-.169-.503z"
                    fill="#ffe576"
                  />
                  <path
                    d="m18.647 20.813c-.846-.315-1.744-.481-2.647-.481s-1.801.165-2.647.481c.086-1.819-.498-3.611-1.636-5.036 1.758-.483 3.282-1.591 4.285-3.113 1.007 1.524 2.527 2.628 4.281 3.113-1.136 1.421-1.72 3.212-1.636 5.036z"
                    fill="#ffce00"
                  />
                </g>
              </svg>
              <span>Stars</span>
              <CountUp end={data?.stargazers_count || 0} duration={0.4} separator=" " />
            </a>
          </div>
        </h2>
        <h1 className={clsx(styles.tagline)}>
          Ultimate framework for{" "}
          <b className={clsx(styles.gradientLetters)}>
            data exchange, asynchronous state management, complex persistence and queueing.
          </b>{" "}
        </h1>
        <div className={clsx(styles.addition)}>
          For any <span>Javascript / Typescript</span> environment like <span>Node.js</span>, <span>React</span>,{" "}
          <span>Angular</span>, <span>Svelte</span>, <span>Vue</span> and others.
        </div>

        <div className={styles.buttons}>
          <div className={styles.wrapper}>
            <div className={styles.glow} />
            <Link className="button button--primary button--lg" to="/docs/documentation/Getting Started/Overview">
              Get Started
            </Link>
          </div>
          <Link className="button button--secondary button--lg" to="/docs/guides/Basic/Setup">
            Guides →
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
