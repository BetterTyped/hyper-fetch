import React from "react";

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center w-fit h-fit">
      <span role="status" aria-live="polite" aria-label="Loading" className="inline-block w-12 h-12">
        <svg
          className="animate-spin text-blue-600"
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="opacity-25" cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M44 24c0-11.046-8.954-20-20-20v4c8.837 0 16 7.163 16 16h4z"
          />
        </svg>
      </span>
    </div>
  );
};
