import React from "react";

export const Code: React.FC<{ children: React.ReactNode; fenced?: boolean }> = ({
  children,
  fenced = true,
}) => {
  const Tag = fenced ? "pre" : React.Fragment;
  return (
    <Tag>
      <code className="language-ts">{children}</code>
    </Tag>
  );
};
