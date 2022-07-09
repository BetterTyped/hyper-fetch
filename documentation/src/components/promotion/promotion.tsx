import React from "react";
import clsx from "clsx";

import styles from "./promotion.module.css";

export function Promotion(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <div className={clsx(styles.row)}>
          <h1 className={clsx(styles.title)}>
            Check out{" "}
            <a href="https://bettertyped.com/" target="_blank" rel="noreferrer">
              BetterTyped
            </a>{" "}
            projects!
          </h1>

          <a
            className="button button--primary button--lg"
            href="https://github.com/BetterTyped"
            target="_blank"
            rel="noreferrer"
          >
            Take me to Github
          </a>
        </div>
      </div>
    </section>
  );
}
