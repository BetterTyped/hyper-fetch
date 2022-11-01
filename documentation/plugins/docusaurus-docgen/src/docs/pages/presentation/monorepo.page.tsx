import React from "react";
import * as path from "path";

import { error } from "../../../utils/log.utils";
import { PluginOptions } from "../../../types/package.types";
import { cleanFileName, createFile } from "../../../utils/file.utils";
import { transformMarkdown } from "../../../utils/md.utils";
import { NonParsing } from "../components/non-parsing";

const MonorepoPage: React.FC<{ options: PluginOptions }> = ({ options }) => {
  const { packages, contentDocsOptions } = options;

  return (
    <>
      {`---
sidebar_position: 1
---
  
# Packages

`}
      <NonParsing>
        <div className="api-docs__monorepo-packages">
          <p>List of available packages documentations</p>
          <div className="api-docs__monorepo-row row api-row">
            {packages.map((pkg, index) => (
              <article className="api-docs__monorepo-column col col--6" key={index}>
                <a
                  className="api-docs__monorepo-card card margin-bottom--lg padding--lg pagination-nav__link"
                  href={`/${path.join(contentDocsOptions.routeBasePath, cleanFileName(pkg.title))}`}
                >
                  <h2 className="api-docs__monorepo-card-title text--truncate api-card-title">
                    <img
                      loading="lazy"
                      src={pkg.logo}
                      alt=""
                      className="api-docs__monorepo-card-image"
                      width="24"
                      height="24"
                    />
                    {pkg.title}
                  </h2>
                  <div
                    className="api-docs__monorepo-card-more text--truncate pagination-nav__sublabel"
                    title="Show details »"
                  >
                    Show details »
                  </div>
                </a>
              </article>
            ))}
          </div>
          <br />
          <br />
          <p className="api-docs__footer footer__copyright">Powered by @better-typed</p>
        </div>
      </NonParsing>
    </>
  );
};

export const generateMonorepoPage = (apiDocsRoot: string, options: PluginOptions) => {
  const html = transformMarkdown(<MonorepoPage options={options} />);

  try {
    const routePath = path.join(apiDocsRoot, "index.md");
    createFile(routePath, html);
  } catch (err) {
    error(JSON.stringify(err));
  }
};
