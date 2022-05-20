import { JSONOutput } from "typedoc";

import { defaultTextsOptions } from "../constants/options.constants";
import { PluginOptions } from "../types/package.types";
import { KindTypes } from "./md.constants";

type CardBlockInputType = {
  link: string;
  title: string;
  description: string;
  logo?: string;
};

type LabelStates = "info" | "success" | "warning" | "danger" | "kind";
export type AdmonitionTypes = "note" | "tip" | "info" | "caution" | "danger" | "deprecated";

export const flattenText = (value: string) => {
  return value.trim().replace(/(\r\n|\n|\r)/gm, "");
};

export const getStatusIcon = (tags: string[]) => {
  if (tags?.includes("alpha") || tags?.includes("beta")) {
    return "🚧 ";
  }
  if (tags?.includes("experimental")) {
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
  const tags =
    value.comment?.tags
      ?.filter(({ tag }) => ["alpha", "beta", "experimental"].includes(tag || ""))
      .map(({ tag }) => {
        if (tag === "alpha") {
          return getMdLabel("danger", "Alpha", true);
        } else if (tag === "beta") {
          return getMdLabel("warning", "Beta", true);
        }
        return getMdLabel("info", "Experimental", true);
      }) || [];

  tags.unshift(getMdLabel("kind", value.kindString, true));

  return flattenText(`
  <p className="row api-badges" style={{padding: "0 10px"}}>
  ${tags.join(" ")}
  </p>
  `);
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
  return `<div className="row api-row">${value}</div>`;
};

export const getMdCodeQuote = (value: string): string => {
  return `<code className="api-code">${value}</code>`;
};

export const getMdDescription = (value?: string) => {
  return !value ? "" : `${value}`;
};
export const getMdTable = (
  headers: string[],
  rows: { value: string[]; tag?: { value?: string; type: LabelStates } }[],
) => {
  const head = flattenText(`
    <thead>
      <tr>
        ${headers
          .map((header) =>
            flattenText(`
        <th style={{textAlign: "left"}}>
          ${header}
        </th>`),
          )
          .join("")}
      </tr>
    </thead>`);

  const body = flattenText(
    `<tbody>${rows
      .map(
        (row) =>
          `<tr>\n${row.value
            .map((cell, index) =>
              flattenText(`
                <td>
                  ${flattenText(cell)} ${(!index && !!row.tag && getMdLabel(row.tag.type, row.tag.value)) || ""}
                </td>\n
              `),
            )
            .join("")}</tr>\n`,
      )
      .join("")}</tbody>`,
  );

  return flattenText(`
    <div className="api-table-wrapper" style={{overflowX: "auto"}}>
      <table className="api-table" style={{width: '100%', display: "table"}}>
        ${head}
        ${body}
      </table>
    </div>
`);
};

export const getMdMainLine = () => {
  return flattenText(`
    <hr className="api-main-line" style={{borderColor: "var(--ifm-color-emphasis-200)"}} />
`);
};

export const getMdLine = () => {
  return flattenText(`
    <hr className="api-line" style={{borderColor: "var(--ifm-color-emphasis-400)"}} />
`);
};

export const getMdCopyright = (text: string) => {
  return flattenText(`
    <p style={{
      color: "var(--ifm-color-emphasis-400)",
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

export const getMdBlockLink = (link: string, type: string, name: string) => {
  return flattenText(`
<div className="col col--6 api-reference-block">
  <a className="card margin-bottom--md padding--md pagination-nav__link" href="${link}" style={{height: "fit-content"}}>
    <div className="pagination-nav__sublabel">${type}</div>
    <div className="pagination-nav__label">${name}   »</div>
  </a>
</div>`);
};

export const getMdBoldText = (value: string) => {
  return `<b>${value}</b>`;
};

export const getMdQuoteText = (value: string) => {
  const quoteStyle = flattenText(`
{
  backgroundColor: "var(--ifm-code-background)",
  border: "0.1rem solid rgba(0, 0, 0, 0.1)",
  borderRadius: "var(--ifm-code-border-radius)",
  fontFamily: "var(--ifm-font-family-monospace)",
  fontSize: "var(--ifm-code-font-size)",
  padding: "var(--ifm-code-padding-vertical) var(--ifm-code-padding-horizontal)",
  verticalAlign: "middle"
}`);

  return `<span style={${quoteStyle}}>${value}</span>`;
};

export const getMdLinkedReference = (
  typeName: string,
  packageLink: string,
  reference: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString"> | undefined,
  isQuote = false,
) => {
  const getQuoted = (value: string) => {
    const name = isQuote ? getMdQuoteText(value) : value;
    return name;
  };

  if (!reference || !reference.kindString) {
    return getQuoted(typeName);
  }

  const link = packageLink + `/${reference.kindString}/${reference.name}`;
  return getQuoted(`<a className="api-reference-link" href="${link}">${typeName}</a>`);
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
    textTransform: "uppercase",
  };
  const fillStyles = {
    border: "0px",
    borderRadius: "3px",
    letterSpacing: ".02rem",
    marginLeft: "6px",
    marginRight: "6px",
    padding: "0 6px",
    fontSize: ".7rem",
    textTransform: "uppercase",
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
    kind: {
      ...borderStyles,
      borderColor: "var(--ifm-color-emphasis-200)",
      color: "var(--ifm-color-emphasis-200)",
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
    kind: {
      ...fillStyles,
      background: "var(--ifm-color-emphasis-200)",
      color: "var(--ifm-color-emphasis-900)",
    },
  }[type];

  return flattenText(
    `<b className="api-label api-label-${type}" style={${JSON.stringify(
      filled ? fillStyle : borderStyle,
    )}}>${value}</b>`,
  );
};

export const getVariablePreview = (
  kind: KindTypes.enum | KindTypes.type | KindTypes.var,
  name: string,
  values: string | [string, string][],
) => {
  const keyword = {
    [KindTypes.enum]: "enum",
    [KindTypes.var]: "const",
    [KindTypes.type]: "type",
  }[kind];

  const delimeter = {
    [KindTypes.enum]: ";",
    [KindTypes.var]: ",",
    [KindTypes.type]: ";",
  }[kind];

  const separator = {
    [KindTypes.enum]: " =",
    [KindTypes.var]: ":",
    [KindTypes.type]: ":",
  }[kind];

  const mainSeparator = {
    [KindTypes.enum]: "",
    [KindTypes.var]: " =",
    [KindTypes.type]: " =",
  }[kind];

  if (typeof values === "string") {
    return flattenText(
      `
        ${keyword} ${name}${mainSeparator} ${values};
      `,
    );
  }

  return `
${keyword} ${name}${mainSeparator} {
${values
  .map((value, index) => {
    const isLast = index + 1 === values.length;
    const end = kind === KindTypes.var && isLast ? "" : delimeter;
    return `  ${value[0]}${separator} ${value[1]}${end}\n`;
  })
  .join("")}}`.trim();
};
