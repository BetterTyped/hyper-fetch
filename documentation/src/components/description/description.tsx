import React from "react";
import clsx from "clsx";

import styles from "./description.module.css";

export function Description(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <div className={clsx(styles.row)}>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Builder and Command</h3>
            <div className={clsx(styles.description)}>
              Builder will allow you to easily set the basic specification of the server you intend to communicate,
              setup http client and create commands which are responsible for the configuration of a single endpoint
              data exchange.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Dispatchers and Effects</h3>
            <div className={clsx(styles.description)}>
              Dispatchers help us to handle sending requests based on our preferences - queued, deduplicated, cancelling
              or all at once. Effects allow you to add side effects of executed requests, you can use them as a global
              events handlers.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Cache and Managers</h3>
            <div className={clsx(styles.description)}>
              The cache allows you to store the results of requests for later use - quickly and easily reduce requests
              and server load. Managers allow you to monitor the logs, network state of the application and lifecycle of
              requests.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Persistance and Offline</h3>
            <div className={clsx(styles.description)}>
              Persistence takes a great part of our library architecture, thanks to it you can persist everything -
              whole requests and cache. We automatically handle offline and hold the request until the connection is
              restored.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
