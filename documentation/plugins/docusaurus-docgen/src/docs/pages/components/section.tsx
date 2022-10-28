import React from "react";

import { HeadingType } from "types/components.types";

export const Section: React.FC<{ children: React.ReactNode } & Partial<HeadingType>> = ({
  children,
  headingSize = "h2",
}) => {
  const Tag = headingSize;

  return (
    <div className="api-docs__section">
      <Tag>{children}</Tag>
    </div>
  );
};
