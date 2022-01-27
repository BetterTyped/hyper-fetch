import { flattenText } from "./md.utils";

type CardBlockInputType = {
  link: string;
  title: string;
  description: string;
  logo?: string;
};

type LabelStates = "success" | "danger";

export const cardBlock = ({ link, logo, title, description }: CardBlockInputType) => {
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

export const row = (value: string): string => {
  return `<div class="row api-row">${value}</div>`;
};

export const description = (value?: string) => {
  return !value ? "" : `<p class="api-description">${value}</p>`;
};

export const label = (type: LabelStates, value = "Required") => {
  const mainStyles = {
    border: "1px solid",
    borderRadius: "3px",
    letterSpacing: ".02rem",
    marginLeft: "6px",
    marginRight: "6px",
    padding: "0 6px",
    fontSize: ".7rem",
  };

  const style = {
    success: {
      ...mainStyles,
      borderColor: "var(--ifm-color-success)",
      color: "var(--ifm-color-success)",
    },
    danger: {
      ...mainStyles,
      borderColor: "var(--ifm-color-danger)",
      color: "var(--ifm-color-danger)",
    },
  }[type];

  return flattenText(`<div class="api-label api-label-${type}" style={${JSON.stringify(style)}} >Required</div>`);
};

export const table = (headers: string[], rows: { value: string[]; tag?: { value?: string; type: LabelStates } }[]) => {
  return flattenText(`
<div className="api-table-wrapper" style={{overflowX: "auto"}}>
  <table className="api-table" style={{width: '100%'}}>
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
                  `<td>${flattenText(cell)} ${!index && row.tag && label(row.tag.type, row.tag.value)}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("")}
    </tbody>
  </table>
</div>
`);
};
