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
            <h3 className={clsx(styles.title)}>Http, Graphql, Websockets, SSE</h3>
            <div className={clsx(styles.description)}>
              There is nothing impossible for us, we provide virtually unlimited possibilities for data exchange,
              providing the necessary tools and easy-to-implement solutions.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="bolt" src="/img/features/049-messenger.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Replace and customize the system</h3>
            <div className={clsx(styles.description)}>
              Are you used to proven tools such as Axios, Socket.io or fetch? You can easily use them with Hyper Fetch,
              we do not limit the possibility of combining our platform with proven solutions.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="case" src="/img/features/047-pin.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Persistance and offline first</h3>
            <div className={clsx(styles.description)}>
              The most advanced solution for persistence and offline solutions first. We based our solution on commands
              and a fixed data standard, which allows us to store not only data returned from queries, but also entire
              requests before sending them!
            </div>
          </div>
        </div>
      </div>
      <h3 className={clsx(styles.link)}>
        You can find more details in <Link to="/docs/Core/Overview">Architecture Docs</Link>
      </h3>
    </section>
  );
}
