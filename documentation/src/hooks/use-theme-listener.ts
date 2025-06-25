import { useCallback, useEffect } from "react";
import { useColorMode } from "@docusaurus/theme-common";

export const useThemeListener = () => {
  const { isDarkTheme } = useColorMode();

  const html = document.documentElement;

  const changeElement = useCallback((isDark: boolean) => {
    if (isDark) {
      html.classList.add("tw-dark");
      document.body.setAttribute("arco-theme", "dark");
    } else {
      html.classList.remove("tw-dark");
      document.body.removeAttribute("arco-theme");
    }
  }, []);

  const observer = new MutationObserver((mutation) => {
    const className = (mutation[0].target as any).className as string;
    if ((className.includes("tw-dark") && !isDarkTheme) || (!className.includes("tw-dark") && isDarkTheme)) {
      changeElement(isDarkTheme);
    }
  });

  useEffect(() => {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    changeElement(isDarkTheme);
    return () => {
      observer.disconnect();
      html.classList.remove("tw-dark");
      document.body.removeAttribute("arco-theme");
    };
  }, [isDarkTheme]);
};
