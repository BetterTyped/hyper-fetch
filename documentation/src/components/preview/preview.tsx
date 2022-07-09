/* eslint-disable react/no-unescaped-entities */
import React from "react";
import clsx from "clsx";

import styles from "./preview.module.css";

export function Preview(): JSX.Element {
  return (
    <section className={clsx(styles.container)}>
      <div className="container">
        <h2 className="page-section-title">Simple. Fast. Better.</h2>
        <div className="page-section-subtitle">
          Save time needed to handle state and reducers. Save time on http client setup and it's dependencies.
          Everything is set up right after installation, it's fully configured environment with no external
          dependencies!
        </div>
        <div className={clsx(styles.contact)}>
          <iframe
            src="https://codesandbox.io/embed/hyper-fetch-playground-zszubv?fontsize=14&hidenavigation=1&theme=dark"
            style={{ width: "100%", height: "600px", border: 0, borderRadius: "4px", overflow: "hidden" }}
            title="Hyper Fetch Playground"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </section>
  );
}
