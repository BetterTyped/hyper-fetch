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
              <img className={styles.featureSvg} alt="box" src="/img/features/049-messenger.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Full typesafety</h3>
            <div className={clsx(styles.description)}>
              Make changes and iterate with confidence by taking full advantage of Typescript.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="box" src="/img/features/041-whatsapp.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Realtime connection</h3>
            <div className={clsx(styles.description)}>
              Solution for easy integration between queries and an open communication channel.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="box" src="/img/features/026-tips.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Easy progress tracking</h3>
            <div className={clsx(styles.description)}>
              Preview each request and access upload and download status in a fabulously simple way.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="box" src="/img/features/059-slack.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Adaptable by design</h3>
            <div className={clsx(styles.description)}>Written to support all formats, requirements and protocols.</div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="box" src="/img/features/012-daily health app.svg" />
            </div>
            <h3 className={clsx(styles.title)}>Offline first and persistent</h3>
            <div className={clsx(styles.description)}>
              Deliver a top-notch experience to your users regardless of their connection status.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <div className={styles.imageWrapper}>
              <img className={styles.featureSvg} alt="box" src="/img/features/064-movies app.svg" />
            </div>
            <h3 className={clsx(styles.title)}>With great DX</h3>
            <div className={clsx(styles.description)}>
              Our code will walk you through the ropes thanks to its outstanding autocomplete capabilities.
            </div>
          </div>
        </div>
      </div>
      <h3 className={clsx(styles.link)}>
        You can find more details in <Link to="/docs/documentation/Core/Overview">Architecture Docs</Link>
      </h3>
    </section>
  );
}
