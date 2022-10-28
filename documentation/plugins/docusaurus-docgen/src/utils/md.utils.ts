import { NodeHtmlMarkdown } from "node-html-markdown";
import React from "react";
import { renderToString } from "react-dom/server";
/**
 * Processing
 */

const sanitizeHtmlComments = (html: string) => {
  return html.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, "");
};

const replaceCurlyBrackets = (html: string) => {
  return html.replace(/&amp;rbrace;/g, "&#125;").replace(/&amp;lbrace;/g, "&#123;");
};

const transform = (html: string) => {
  return NodeHtmlMarkdown.translate(html);
};

export const runMdPostprocessing = (component: React.ReactElement) => {
  const processes = [sanitizeHtmlComments, replaceCurlyBrackets, transform];

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
