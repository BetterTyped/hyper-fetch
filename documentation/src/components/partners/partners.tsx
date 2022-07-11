import React from "react";
import clsx from "clsx";

import styles from "./partners.module.css";

export function Partners(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <h2 className="page-section-title">Be our partner.</h2>
        <div className="page-section-subtitle">
          BetterTyped was created to make the best open source tools. However, it is an extremely demanding task, so we
          encourage you to partner and sponsor our work.
        </div>
        <div className={clsx(styles.contact)}>
          <a className="button button--primary button--lg" href="mailto:contact@bettertyped.com">
            Contact us
          </a>
        </div>
        <div className={clsx(styles.sponsors)}>
          <a className={clsx(styles.card)} href="mailto:contact@bettertyped.com">
            <div className={clsx(styles.plus)}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M 11 2 L 11 11 L 2 11 L 2 13 L 11 13 L 11 22 L 13 22 L 13 13 L 22 13 L 22 11 L 13 11 L 13 2 Z"
                />
              </svg>
            </div>
            <div className={clsx(styles.content)}>
              <b className={clsx(styles.title)}>Become a sponsor</b>
              <div className={clsx(styles.description)}>Support our work</div>
            </div>
          </a>
          <a className={clsx(styles.card)} href="mailto:contact@bettertyped.com">
            <div className={clsx(styles.plus)}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M 11 2 L 11 11 L 2 11 L 2 13 L 11 13 L 11 22 L 13 22 L 13 13 L 22 13 L 22 11 L 13 11 L 13 2 Z"
                />
              </svg>
            </div>
            <div className={clsx(styles.content)}>
              <b className={clsx(styles.title)}>Become a sponsor</b>
              <div className={clsx(styles.description)}>Support our work</div>
            </div>
          </a>
          <a className={clsx(styles.card)} href="mailto:contact@bettertyped.com">
            <div className={clsx(styles.plus)}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M 11 2 L 11 11 L 2 11 L 2 13 L 11 13 L 11 22 L 13 22 L 13 13 L 22 13 L 22 11 L 13 11 L 13 2 Z"
                />
              </svg>
            </div>
            <div className={clsx(styles.content)}>
              <b className={clsx(styles.title)}>Become a sponsor</b>
              <div className={clsx(styles.description)}>Support our work</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
