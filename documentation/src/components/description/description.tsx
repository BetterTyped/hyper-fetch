import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";

import styles from "./description.module.css";

export function Description(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <h2 className="page-section-title">No more architecture struggle.</h2>
        <div className="page-section-subtitle">
          We offer the e2e solution, unified data flow, and full integrity with external solutions. Here you will find
          recipes for most data management or requesting problems, and solutions for writing effective tests and
          maintenance.
        </div>
        <div className={clsx(styles.row)}>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="box" src="/img/features/070-file hosting.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Builder and Command</h3>
            <div className={clsx(styles.description)}>
              Builder will allow you to easily set the basic specification of the server you intend to communicate,
              setup http client and create commands which are responsible for the configuration of a single endpoint
              data exchange.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="bolt" src="/img/features/049-messenger.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Dispatchers and Effects</h3>
            <div className={clsx(styles.description)}>
              Dispatchers help us to handle sending requests based on our preferences - queued, deduplicated, cancelling
              or all at once. Effects allow you to add side effects of executed requests, you can use them as a global
              events handlers.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="case" src="/img/features/047-pin.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Cache and Managers</h3>
            <div className={clsx(styles.description)}>
              The cache allows you to store the results of requests for later use - quickly and easily reduce requests
              and server load. Managers allow you to monitor the logs, network state of the application and lifecycle of
              requests.
            </div>
          </div>
        </div>
      </div>
      <h3 className={clsx(styles.link)}>
        You can find more details in <Link to="/docs/Architecture/Builder">Architecture Docs</Link>
      </h3>
    </section>
  );
}
