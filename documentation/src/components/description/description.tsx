import React from "react";
import clsx from "clsx";

import styles from "./description.module.css";

export function Description(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <div className={clsx(styles.row)}>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.title)}>Curabitur pulvinar gravida</h2>
            <div className={clsx(styles.description)}>
              Aliquam fringilla nibh vitae maximus convallis. Maecenas a lacus vel neque dignissim suscipit eu at nunc.
              Donec tincidunt orci luctus, fringilla mi sed, eleifend purus. Nullam facilisis, lacus eget sodales
              blandit, ligula eros pellentesque ex, eu feugiat nulla magna vel sem.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.title)}>Nullam facilisis</h2>
            <div className={clsx(styles.description)}>
              Aliquam fringilla nibh vitae maximus convallis. Maecenas a lacus vel neque dignissim suscipit eu at nunc.
              Donec tincidunt orci luctus, fringilla mi sed, eleifend purus. Nullam facilisis, lacus eget sodales
              blandit, ligula eros pellentesque ex, eu feugiat nulla magna vel sem.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.title)}>Maecenas a lacus</h2>
            <div className={clsx(styles.description)}>
              Aliquam fringilla nibh vitae maximus convallis. Maecenas a lacus vel neque dignissim suscipit eu at nunc.
              Donec tincidunt orci luctus, fringilla mi sed, eleifend purus. Nullam facilisis, lacus eget sodales
              blandit, ligula eros pellentesque ex, eu feugiat nulla magna vel sem.
            </div>
          </div>
          <div className={clsx(styles.block)}>
            <h2 className={clsx(styles.title)}>Maecenas a lacus</h2>
            <div className={clsx(styles.description)}>
              Aliquam fringilla nibh vitae maximus convallis. Maecenas a lacus vel neque dignissim suscipit eu at nunc.
              Donec tincidunt orci luctus, fringilla mi sed, eleifend purus. Nullam facilisis, lacus eget sodales
              blandit, ligula eros pellentesque ex, eu feugiat nulla magna vel sem.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
