import { HTMLProps } from "react";
import clsx from "clsx";

import styles from "./badge.module.css";

export const Badge = ({
  children,
  as: Component = "span",
  ...props
}: { children: React.ReactNode; as: "a" | "span" } & Partial<HTMLProps<HTMLAnchorElement>>) => {
  return (
    <Component {...props} className={clsx(styles.badge, props.className)}>
      <span className={styles.backdrop} />
      {children}
    </Component>
  );
};
