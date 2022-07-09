import React from "react";
import clsx from "clsx";

import styles from "./partners.module.css";

export function Partners(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <h2 className="page-section-title">Be a partner in our solutions.</h2>
        <div className="page-section-subtitle">
          BetterTyped was created to make the best open source tools. However, it is an extremely demanding task, so we
          encourage you to partner and sponsor our work.
        </div>
        <div className={clsx(styles.contact)}>
          <a className="button button--primary button--lg" href="mailto:contact@bettertyped.com">
            Contact us
          </a>
        </div>
      </div>
    </section>
  );
}
