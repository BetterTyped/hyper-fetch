import React from "react";
import clsx from "clsx";

import styles from "./description.module.css";

export function Description(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <div className={clsx(styles.row)}>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Builder and command</h3>
            <div className={clsx(styles.description)}>
              Builder will allow you to easily set the basic specification of the server you intend to communicate with
              - be it rest or graphql. The command is responsible for the settings for a single edpoint. If you want to
              use axios or any other library - just do it, we don't limit you in any way and all we do is standardize
              the information flow!
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Offline with persistence</h3>
            <div className={clsx(styles.description)}>
              Queues and persistance will play a great role in react fetch - from now on, these topics will be much
              easier to tame, which will be helped by the patterns and solutions we use. Regardless of whether you use
              Hyper fetch in your browser or implement native solutions - it all works in any JavaScript environment!
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Cache and queue</h3>
            <div className={clsx(styles.description)}>
              The cache allows you to store the results of requests for later use - quickly and easily reduce requests
              and server load. Queues help us to tame sending requests one by one or their deduplication - use them
              however you like with a simple setup for each individual endpoint!
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h3 className={clsx(styles.title)}>Extensions and testing</h3>
            <div className={clsx(styles.description)}>
              We built the library on classes, thanks to which we have easy access to the current developer environment
              and their settings during testing - no more code deduplication, use available interfaces and build your
              own solutions on our foundations! For us, community matters, so we encourage you to go on this adventure
              together!
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
