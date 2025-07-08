import { useEffect, useRef, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { cn } from "@site/src/lib/utils";

import { pluginConfig } from "./config";

export const Cookies = () => {
  const [show, setShow] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    CookieConsent.run({
      ...pluginConfig,
      onConsent() {
        setShow(false);
      },
      onChange() {
        setShow(false);
      },
    });
  }, []);

  return <div id="cookieconsent" className={cn("cc--darkmode", show && "show--consent")} ref={ref} />;
};
