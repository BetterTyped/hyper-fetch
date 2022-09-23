/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { TimelineMax, Back } from "gsap";

import styles from "./features.module.css";
import "./animation.scss";

type FeatureItem = {
  description: string;
  // eslint-disable-next-line react/require-default-props
  link?: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    description: "Simple setup",
    link: <Link to="/guides/Basic/Setup">Read more</Link>,
  },
  {
    description: "Automatic caching",
    link: <Link to="/docs/Architecture/Cache">Read more</Link>,
  },
  {
    description: "Built-in client",
    link: <Link to="/docs/Architecture/Client">Read more</Link>,
  },
  {
    description: "Request cancellation",
    link: <Link to="/guides/Advanced/Cancellation">Read more</Link>,
  },
  {
    description: "Persistance",
    link: <Link to="/guides/Advanced/Persistence">Read more</Link>,
  },
  {
    description: "Easy to test",
    link: <Link to="/docs/Getting%20Started/Testing">Read more</Link>,
  },
  {
    description: "Window Focus/Blur Events",
    link: <Link to="/guides/React/Window%20Focus%20&%20Blur">Read more</Link>,
  },
  {
    description: "SSR Support",
    link: <Link to="/docs/Getting%20Started/Environment">Read more</Link>,
  },
  {
    description: "Authentication",
    link: <Link to="/guides/Basic/Authentication">Read more</Link>,
  },
  {
    description: "Queueing",
    link: <Link to="/guides/Advanced/Queueing">Read more</Link>,
  },
  {
    description: "Offline first ready",
    link: <Link to="/guides/Advanced/Offline">Read more</Link>,
  },
  {
    description: "Prefetching",
    link: <Link to="/guides/Advanced/Prefetching">Read more</Link>,
  },
];

function Feature({ description, link }: FeatureItem) {
  return (
    <div className={clsx(styles.feature)}>
      <div className={clsx(styles.imgWrapper)}>
        <svg
          className={clsx(styles.img)}
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
          fill="var(--ifm-color-warning-light)"
        >
          <path d="M400,48H112a64.07,64.07,0,0,0-64,64V400a64.07,64.07,0,0,0,64,64H400a64.07,64.07,0,0,0,64-64V112A64.07,64.07,0,0,0,400,48ZM364.25,186.29l-134.4,160a16,16,0,0,1-12,5.71h-.27a16,16,0,0,1-11.89-5.3l-57.6-64a16,16,0,1,1,23.78-21.4l45.29,50.32L339.75,165.71a16,16,0,0,1,24.5,20.58Z" />
        </svg>
      </div>
      <div className={clsx(styles.details)}>
        <div className={styles.description}>{description}</div>
        {link}
      </div>
    </div>
  );
}

export function Features(): JSX.Element {
  useEffect(() => {
    const bolt = document.querySelector(".bolt");
    const element = bolt.querySelector("div");

    const animation = new TimelineMax({
      onStart() {
        bolt.classList.add("animate");
      },
      onComplete() {
        bolt.classList.remove("animate");
        setTimeout(() => {
          animation.restart();
        }, 1000);
      },
    })
      .set(element, {
        rotation: 360,
      })
      .to(element, 0.7, {
        y: 80,
        rotation: 370,
      })
      .to(element, 0.6, {
        y: -140,
        rotation: 20,
      })
      .to(element, 0.1, {
        rotation: -24,
        y: 80,
      })
      .to(element, 0.8, {
        ease: Back.easeOut.config(1.6),
        rotation: 0,
        y: 0,
      });
  }, []);

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="bolt">
          <svg viewBox="0 0 170 57" className="white left">
            <path d="M36.2701759,17.9733192 C-0.981139498,45.4810755 -7.86361824,57.6618438 15.6227397,54.5156241 C50.8522766,49.7962945 201.109341,31.1461782 161.361488,2" />
          </svg>
          <svg viewBox="0 0 170 57" className="white right">
            <path d="M36.2701759,17.9733192 C-0.981139498,45.4810755 -7.86361824,57.6618438 15.6227397,54.5156241 C50.8522766,49.7962945 201.109341,31.1461782 161.361488,2" />
          </svg>
          <div>
            <span />
          </div>
          <svg viewBox="0 0 112 44" className="circle">
            <path d="M96.9355003,2 C109.46067,13.4022454 131.614152,42 56.9906735,42 C-17.6328048,42 1.51790702,13.5493875 13.0513641,2" />
          </svg>
          <svg viewBox="0 0 70 3" className="line left">
            <path transform="translate(-2.000000, 0.000000)" d="M2,1.5 L70,1.5" />
          </svg>
          <svg viewBox="0 0 70 3" className="line right">
            <path transform="translate(-2.000000, 0.000000)" d="M2,1.5 L70,1.5" />
          </svg>
        </div>

        <h2 className="page-section-title">Future is now. Features are here.</h2>
        <div className="page-section-subtitle">
          We provide not only a full range of functionalities, but also interfaces and possibilities to create solutions
          tailored to your needs. You can easily connect to the events that power our architecture and you can
          confidently create your own logic and have full control over the data flow like nowhere else.
        </div>
        <div className={styles.list}>
          {FeatureList.map((props, idx) => (
            // eslint-disable-next-line react/no-array-index-key, react/jsx-props-no-spreading
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
      <h3 className={clsx(styles.link)}>
        You can find more details in <Link to="/docs/Getting%20Started/Comparison">Comparison</Link>
      </h3>
    </section>
  );
}
