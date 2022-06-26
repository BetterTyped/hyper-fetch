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
              <img alt="" src="https://github.com/prc5.png" />
            </h2>
            <h2 className={clsx(styles.title)}>Maciej Pyrc</h2>
            <a className={clsx(styles.description)} href="https://github.com/prc5" target="_blank" rel="noreferrer">
              Read more
            </a>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.image)}>
              <img alt="" src="https://github.com/GerasNyx.png" />
            </h2>
            <h2 className={clsx(styles.title)}>Kacper Skawina</h2>
            <a className={clsx(styles.description)} href="https://github.com/GerasNyx" target="_blank" rel="noreferrer">
              Read more
            </a>
          </div>
          {/* <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.image)}>
              <img alt="" src="https://github.com/jkosior.png" />
            </h2>
            <h2 className={clsx(styles.title)}>Jakub Kosior</h2>
            <a className={clsx(styles.description)} href="https://github.com/jkosior" target="_blank" rel="noreferrer">
              Read more
            </a>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.image)}>
              <img alt="" src="https://github.com/albelewandowski.png" />
            </h2>
            <h2 className={clsx(styles.title)}>Albert Lewandowski</h2>
            <a
              className={clsx(styles.description)}
              href="https://github.com/albelewandowski"
              target="_blank"
              rel="noreferrer"
            >
              Read more
            </a>
          </div> */}
        </div>
      </div>
    </section>
  );
}
