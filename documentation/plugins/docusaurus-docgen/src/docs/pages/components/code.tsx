import React from "react";

export const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <pre>
      <code className="language-ts">{children}</code>
    </pre>
  );
};
