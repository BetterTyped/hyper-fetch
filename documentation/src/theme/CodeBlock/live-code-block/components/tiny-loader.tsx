import React from "react";

export const TinyLoader: React.FC = () => {
  return (
    <span role="status" aria-live="polite" aria-label="Loading" className="inline-block w-4 h-4 align-middle">
      <svg
        className="animate-spin text-white"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M15 8c0-3.866-3.134-7-7-7v2c2.761 0 5 2.239 5 5h2z" />
      </svg>
    </span>
  );
};
