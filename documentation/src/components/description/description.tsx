import React from "react";
import clsx from "clsx";

import styles from "./description.module.css";

export function Description(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <div className={clsx(styles.row)}>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.title)}>Title</h2>
            <div className={clsx(styles.description)}>Description</div>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.title)}>Title</h2>
            <div className={clsx(styles.description)}>Description</div>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.title)}>Title</h2>
            <div className={clsx(styles.description)}>Description</div>
          </div>
        </div>
      </div>
    </section>
  );
}
