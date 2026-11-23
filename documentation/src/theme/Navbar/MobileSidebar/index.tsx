import React, { useCallback } from "react";
import {
  useLockBodyScroll,
  useNavbarMobileSidebar,
} from "@docusaurus/theme-common/internal";
import { MobileNav } from "@site/src/components/mobile-nav/mobile-nav";

/** Replaces the stock slide-in drawer with the bottom sheet in `MobileNav`. Desktop widths render nothing. */
// eslint-disable-next-line import/no-default-export
export default function NavbarMobileSidebar(): React.ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  useLockBodyScroll(mobileSidebar.shown);

  const { shown, toggle } = mobileSidebar;
  const close = useCallback(() => {
    if (shown) toggle();
  }, [shown, toggle]);

  if (!mobileSidebar.shouldRender) {
    return null;
  }

  return <MobileNav open={shown} onClose={close} />;
}
