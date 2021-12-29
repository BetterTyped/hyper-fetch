import React from "react";
import clsx from "clsx";

import styles from "./creators.module.css";

export function Creators(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <h2 className="page-section-title-center">Creators</h2>
        <div className={clsx(styles.row)}>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.image)}>
              <img alt="" src="" />
            </h2>
            <h2 className={clsx(styles.title)}>Maciej</h2>
            <div className={clsx(styles.description)}>The man, the myth, the ultimate coding machine</div>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.image)}>
              <img alt="" src="" />
            </h2>
            <h2 className={clsx(styles.title)}>Kacper</h2>
            <div className={clsx(styles.description)}>Found edge cases in General Theory Of Relativity</div>
          </div>
        </div>
      </div>
    </section>
  );
}
