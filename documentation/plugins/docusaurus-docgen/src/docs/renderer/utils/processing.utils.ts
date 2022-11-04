import React from "react";
import { renderToString } from "react-dom/server";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { parse } from "node-html-parser";

import { noParsingClass } from "../../pages/components/non-parsing";

/**
 * Processing
 */
const sanitizeHtmlComments = (html: string) => {
  return html.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, "");
};

const replaceCurlyBrackets = (html: string) => {
  return html.replace(/&amp;rbrace;/g, "&#125;").replace(/&amp;lbrace;/g, "&#123;");
};

const replaceBrackets = (html: string) => {
  return html.replace(/&lt;/g, "&amplt;").replace(/&gt;/g, "&ampgt;");
};

const replaceCodeBrackets = (html: string) => {
  return html.replace(/(?<=`)([\s\S]*?)(?=`)/g, (substring) => {
    return substring
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amplt;/g, "<")
      .replace(/&ampgt;/g, ">");
  });
};

const transform = (html: string) => {
  const parsedHtml = parse(html, {
    voidTag: {
      tags: [
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
      ],
      closingSlash: true,
    },
  });

  const nodes = parsedHtml.getElementsByTagName("*") as unknown as HTMLElement[];
  const parsed: HTMLElement[] = [];

  function childOf(child: HTMLElement, elements: HTMLElement[]) {
    let element = child;
    while (element && !elements.includes(element)) {
      element = element?.parentNode as HTMLElement;
    }
    return !!element;
  }

  Array.from(nodes).forEach((node) => {
    const nonParsingElements = Array.from(parsedHtml.querySelectorAll(`.${noParsingClass}`));
    const hasNonParsingChild = node.querySelector(`.${noParsingClass}`);
    const isNonParsingChild = nonParsingElements?.length
      ? childOf(node, nonParsingElements as unknown as HTMLElement[])
      : false;
    const hasTableChild = !!Array.from(node.getElementsByTagName("TABLE")).length;

    if (isNonParsingChild) {
      return;
    }
    if (node.tagName === "CODE" && node.parentElement?.tagName === "PRE") {
      return;
    }
    if (node.tagName === "PRE") {
      return node.parentElement?.innerHTML.replace(
        node.outerHTML,
        `\n\n${NodeHtmlMarkdown.translate(node.outerHTML)}\n\n`,
      );
    }
    if (hasTableChild) {
      return;
    }
    if (node.tagName === "TABLE") {
      parsed.push(node);
      const cells = node.getElementsByTagName(`td`);
      if (cells) {
        Array.from(cells).forEach((cell) => {
          // eslint-disable-next-line no-param-reassign
          cell.innerHTML = `\n\n${NodeHtmlMarkdown.translate(cell.outerHTML)}\n\n`;
        });
      }
      return;
    }
    if (hasNonParsingChild) {
      return;
    }
    if (node.classList.contains(noParsingClass)) {
      return;
    }
    if (childOf(node, parsed)) {
      return;
    }
    parsed.push(node);
    // eslint-disable-next-line no-param-reassign
    node.innerHTML = `\n\n${NodeHtmlMarkdown.translate(node.outerHTML)}\n\n`;
  });

  return parsedHtml.outerHTML;
};

export const runMdPostprocessing = (component: React.ReactElement) => {
  const processes = [
    sanitizeHtmlComments,
    replaceCurlyBrackets,
    replaceBrackets,
    transform,
    replaceCodeBrackets,
  ];

  let newHtml = renderToString(component);

  processes.forEach((processing) => {
    newHtml = processing(newHtml);
  });
  return newHtml;
};

/**
 * Converting
 */
export const transformMarkdown = (component: React.ReactElement) => {
  return runMdPostprocessing(component);
};
