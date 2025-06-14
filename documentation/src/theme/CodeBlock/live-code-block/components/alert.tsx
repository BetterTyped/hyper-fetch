import React from "react";

export const Alert = ({ children, ...props }) => (
  <div
    {...props}
    className="relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground"
  >
    {children}
  </div>
);

export const AlertTitle = ({ children, ...props }) => (
  <h5 {...props} className="mb-1 font-medium leading-none tracking-tight">
    {children}
  </h5>
);

export const AlertDescription = ({ children, ...props }) => (
  <div {...props} className="text-sm [&_p]:leading-relaxed">
    {children}
  </div>
);
