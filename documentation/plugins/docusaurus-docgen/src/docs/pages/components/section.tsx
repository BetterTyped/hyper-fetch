import React from "react";

import { HeadingType } from "types/components.types";

export const Section: React.FC<
  { title: string; children: React.ReactNode } & Partial<HeadingType>
> = ({ title, children, headingSize = "h2" }) => {
  const Tag = headingSize;

  if (!children) {
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
