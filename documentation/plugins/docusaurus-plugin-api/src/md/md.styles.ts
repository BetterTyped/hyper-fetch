import { JSONOutput } from "typedoc";

import { flattenText } from "./md.utils";
import { defaultTextsOptions } from "../constants/options.constants";
import { PluginOptions } from "../types/package.types";

type CardBlockInputType = {
  link: string;
  title: string;
  description: string;
  logo?: string;
};

type LabelStates = "info" | "success" | "warning" | "danger";
export type AdmonitionTypes = "note" | "tip" | "info" | "caution" | "danger" | "deprecated";

export const getStatusIcon = (tags: string[]) => {
  if (tags.includes("alpha") || tags.includes("beta")) {
    return "🚧 ";
  }
  if (tags.includes("experimental")) {
    return "🧪 ";
  }

  return ``;
};

export const getMdTitle = (value: JSONOutput.DeclarationReflection) => {
  const name = value.name;
  const tagsStatuses = value.comment?.tags?.map(({ tag }) => tag) || [];

  const icon = getStatusIcon(tagsStatuses);

  return flattenText(`${icon}${name}`);
};

export const getMdBadges = (value: JSONOutput.DeclarationReflection) => {
  const tags = value.comment?.tags
    ?.filter(({ tag }) => ["alpha", "beta", "experimental"].includes(tag))
    .map(({ tag }) => {
      if (tag === "alpha") {
        return getMdLabel("danger", "Alpha", true);
      } else if (tag === "beta") {
        return getMdLabel("warning", "Beta", true);
      }
      return getMdLabel("info", "Experimental", true);
    });

  if (!tags) {
    return "";
  }

  return flattenText(`
  <p className="row api-badges" style={{padding: "0 10px"}}>
  ${tags.join(" ")}
  </p>
  `);
};

export const getMdQuoteText = (value: string) => {
  return "`" + value + "`";
};

export const getMdCard = ({ link, logo, title, description }: CardBlockInputType) => {
  const img = logo
    ? `<img style={{maxWidth: "24px", maxHeight: "24px", marginRight: "5px"}} src="${logo}" alt=""/>`
    : "";

  return flattenText(`
    <article className="col col--6 api-card-column">
      <a style={{background: "var(--ifm-card-background-color)"}} className="card margin-bottom--lg padding--lg pagination-nav__link api-card-container" href="${link}">
        <h2 style={{color: "var(--ifm-color-emphasis-1000)", display: "flex", alignItems: "center"}} className="text--truncate api-card-title" title="${title}">
          ${img} ${title}
        </h2>
        <div className="text--truncate pagination-nav__sublabel api-card-description" title="${description}">
          ${description}
        </div>
      </a>
    </article>
`);
};

export const getMdRow = (value: string): string => {
  return `<div class="row api-row">${value}</div>`;
};

export const getMdDescription = (value?: string) => {
  return !value ? "" : `<p class="api-description">${value}</p>`;
};
export const getMdTable = (
  headers: string[],
  rows: { value: string[]; tag?: { value?: string; type: LabelStates } }[],
) => {
  return flattenText(`
    <div className="api-table-wrapper" style={{overflowX: "auto"}}>
      <table className="api-table" style={{width: '100%', display: "table"}}>
        <thead>
          <tr>${headers.map((header) => `<th style={{textAlign: "left"}}>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row.value
                  .map(
                    (cell, index) =>
                      `<td>${flattenText(cell)} ${
                        (!index && row.tag && getMdLabel(row.tag.type, row.tag.value)) || ""
                      }</td>`,
                  )
                  .join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
`);
};

export const getMdCopyright = (text: string) => {
  return flattenText(`
    <p style={{
      color: "var(--ifm-color-emphasis-200)",
      fontSize: "12px",
      textAlign: "center"
    }}>
      ${text}
    </p>
`);
};

export const getMdAdmonitions = (
  tags: JSONOutput.CommentTag[] | undefined,
  type: AdmonitionTypes,
  options?: PluginOptions,
) => {
  function capitalizeFirstLetter(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  const isDeprecated = type === "deprecated";
  const admonitionType = isDeprecated ? "caution" : type;
  const defaultText = isDeprecated ? options?.texts?.deprecated ?? defaultTextsOptions.deprecated : "";

  if (tags?.length) {
    return [
      tags
        .filter(({ tag, text }) => tag === type && (text || defaultTextsOptions))
        .map(({ text }) =>
          `
:::${admonitionType} ${capitalizeFirstLetter(type)}
${text || defaultText}
:::`.trim(),
        ),
    ];
  }

  return [];
};

export const getMdLabel = (type: LabelStates, value = "Required", filled = false) => {
  const borderStyles = {
    border: "2px solid",
    borderRadius: "3px",
    letterSpacing: ".02rem",
    marginLeft: "6px",
    marginRight: "6px",
    padding: "0 6px",
    fontSize: ".7rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    width: "fit-content",
    maxWidth: "fit-content",
  };
  const fillStyles = {
    border: "0px",
    borderRadius: "3px",
    letterSpacing: ".02rem",
    marginLeft: "6px",
    marginRight: "6px",
    padding: "0 6px",
    fontSize: ".7rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    width: "fit-content",
    maxWidth: "fit-content",
  };

  const borderStyle = {
    success: {
      ...borderStyles,
      borderColor: "var(--ifm-color-success)",
      color: "var(--ifm-color-success)",
    },
    warning: {
      ...borderStyles,
      borderColor: "var(--ifm-color-warning)",
      color: "var(--ifm-color-warning)",
    },
    danger: {
      ...borderStyles,
      borderColor: "var(--ifm-color-danger)",
      color: "var(--ifm-color-danger)",
    },
    info: {
      ...borderStyles,
      borderColor: "var(--ifm-color-info)",
      color: "var(--ifm-color-info)",
    },
  }[type];

  const fillStyle = {
    success: {
      ...fillStyles,
      background: "var(--ifm-color-success)",
      color: "#fff",
    },
    warning: {
      ...fillStyles,
      background: "var(--ifm-color-warning)",
      color: "#fff",
    },
    danger: {
      ...fillStyles,
      background: "var(--ifm-color-danger)",
      color: "#fff",
    },
    info: {
      ...fillStyles,
      background: "var(--ifm-color-info)",
      color: "#fff",
    },
  }[type];

  return flattenText(
    `<div class="api-label api-label-${type}" style={${JSON.stringify(
      filled ? fillStyle : borderStyle,
    )}}>${value}</div>`,
  );
};
