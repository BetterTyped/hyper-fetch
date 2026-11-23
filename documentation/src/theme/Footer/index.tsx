import React from "react";
import Link from "@docusaurus/Link";
import { useThemeConfig } from "@docusaurus/theme-common";
import { ArrowUpRight } from "lucide-react";
import { HfBolt } from "@site/src/components/hf-bolt/hf-bolt";
import { SkillsCommand } from "@site/src/components/landing/shared/skills-command";
import { GitHubStarButton } from "@site/src/components/star-button/star-button";

import "./footer.css";

type FooterLink = { label: string; to?: string; href?: string };
type FooterColumn = { title: string; items: FooterLink[] };

const FooterItem = ({ item }: { item: FooterLink }) => {
  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="hf-footer__link"
      >
        {item.label}
        <ArrowUpRight className="hf-footer__external" aria-hidden />
      </a>
    );
  }
  return (
    <Link to={item.to} className="hf-footer__link">
      {item.label}
    </Link>
  );
};

/**
 * The site footer. The columns come from `themeConfig.footer.links`, so links stay in the config. Around them: the
 * brand with the star count, the tagline and the agent skills command, a thin bottom bar and the wordmark fading out
 * under the page.
 */
// eslint-disable-next-line import/no-default-export
export default function Footer(): React.ReactNode {
  const { footer } = useThemeConfig();

  if (!footer) {
    return null;
  }

  const columns = (footer.links ?? []) as unknown as FooterColumn[];

  return (
    <footer className="hf-footer">
      <div className="hf-footer__inner">
        <div className="hf-footer__panel bg-with-noise">
          <div className="hf-footer__glow" aria-hidden />

          <div className="hf-footer__brand">
            <div className="hf-footer__brand-head">
              <Link
                to="/"
                className="hf-footer__logo"
                aria-label="HyperFetch home"
              >
                <span className="hf-footer__logo-tile">
                  <HfBolt />
                </span>
                <span className="hf-footer__logo-name">HyperFetch</span>
              </Link>
              <GitHubStarButton
                owner="BetterTyped"
                repo="hyper-fetch"
                fallbackStars={1300}
                variant="navbar"
              />
            </div>
            <p className="hf-footer__tagline">
              Fetch <span className="bt-gold-text">anything.</span>
              <br />
              Type everything.
            </p>
            <p className="hf-footer__line">
              One typed client for REST, GraphQL, tRPC, oRPC, Firebase,
              WebSockets and SSE.
            </p>
            <SkillsCommand className="hf-footer__command" />
          </div>

          <nav className="hf-footer__columns" aria-label="Footer">
            {columns.map((column) => (
              <div key={column.title} className="hf-footer__column">
                <div className="hf-footer__title">{column.title}</div>
                <ul>
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <FooterItem item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="hf-footer__bar">
          <span>{footer.copyright}</span>
          <span className="hf-footer__bar-links">
            <a
              href="https://github.com/BetterTyped/hyper-fetch/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apache 2.0
            </a>
            <span className="hf-footer__dot" aria-hidden />
            <a
              href="https://bettertyped.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Made by BetterTyped
            </a>
          </span>
        </div>
      </div>

      <div className="hf-footer__wordmark" aria-hidden>
        HyperFetch
      </div>
    </footer>
  );
}
