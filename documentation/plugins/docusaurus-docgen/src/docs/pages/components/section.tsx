import React from "react";
import ReactDOMServer from "react-dom/server";

import { HeadingType } from "types/components.types";

const isChildNull = (children: React.ReactElement) => {
  return !ReactDOMServer.renderToStaticMarkup(children);
};

export const Section: React.FC<
  { title: string; children: React.ReactNode } & Partial<HeadingType>
> = ({ title, children, headingSize = "h2" }) => {
  const Tag = headingSize;

  if (isChildNull(children as React.ReactElement)) {
    return null;
  }

  return (
    <>
      <div className="api-docs__section">
        <Tag>{title}</Tag>
      </div>
      {children}
    </>
  );
};
