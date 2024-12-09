import siteConfig from "@generated/docusaurus.config";
import type * as PrismNamespace from "prismjs";
import type { Optional } from "utility-types";

export default function prismIncludeLanguages(PrismObject: typeof PrismNamespace): void {
  const {
    themeConfig: { prism },
  } = siteConfig;
  const { additionalLanguages } = prism as { additionalLanguages: string[] };

  // Prism components work on the Prism instance on the window, while prism-
  // react-renderer uses its own Prism instance. We temporarily mount the
  // instance onto window, import components to enhance it, then remove it to
  // avoid polluting global namespace.
  // You can mutate PrismObject: registering plugins, deleting languages... As
  // long as you don't re-assign it

  const PrismBefore = globalThis.Prism;
  globalThis.Prism = PrismObject;

  additionalLanguages.forEach((lang) => {
    if (lang === "php") {
      // eslint-disable-next-line global-require
      require("prismjs/components/prism-markup-templating.js");
    }
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(`prismjs/components/prism-${lang}`);
  });

  // const extend = (lang: Record<any, any>) => {
  //   const newRules = {
  //     constructor: { pattern: /constructor/, alias: "function" },
  //   };
  //   Object.assign(lang, newRules);
  // };
  // extend(PrismObject.languages.ts);
  // extend(PrismObject.languages.tsx);

  PrismObject.hooks.add("after-tokenize", (token) => {
    if (token.content === "constructor") {
      token.alias = "function";
      token.type = "constructor";
      return;
    }
    if (token?.tokens) {
      token.tokens?.forEach((innerToken) => {
        if (innerToken.content === "constructor") {
          innerToken.alias = "function";
          innerToken.type = "constructor";
        }
      });
      return;
    }
  });

  // Clean up and eventually restore former globalThis.Prism object (if any)
  delete (globalThis as Optional<typeof globalThis, "Prism">).Prism;
  if (typeof PrismBefore !== "undefined") {
    globalThis.Prism = PrismObject;
  }
}
