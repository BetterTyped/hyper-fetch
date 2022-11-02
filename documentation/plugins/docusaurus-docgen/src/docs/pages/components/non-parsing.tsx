import React from "react";

export const noParsingClass = "api-docs__do-not-parse";

export const NonParsing: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className={noParsingClass}>
      {"\n"}
      {"\n"}
      {children}
      {"\n"}
      {"\n"}
    </span>
  );
};
