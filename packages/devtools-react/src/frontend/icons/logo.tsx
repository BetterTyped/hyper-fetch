export const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18px"
      zoomAndPan="magnify"
      viewBox="0 0 224.87999 299.999988"
      height="24px"
      preserveAspectRatio="xMidYMid meet"
      version="1.0"
      {...props}
    >
      <defs>
        <clipPath id="58708a0c3a">
          <path
            d="M 28.484375 0.078125 L 202.390625 0.078125 L 202.390625 299.917969 L 28.484375 299.917969 Z M 28.484375 0.078125 "
            clipRule="nonzero"
          />
        </clipPath>
        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="nnneon-grad">
          <stop stopColor="#ffa52f" stopOpacity="1" offset="0%" />
          <stop stopColor="#fbc646" stopOpacity="1" offset="100%" />
        </linearGradient>
        <filter
          id="nnneon-filter"
          x="-100%"
          y="-100%"
          width="400%"
          height="400%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            stdDeviation="17 8"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            in="SourceGraphic"
            edgeMode="none"
            result="blur"
          />
        </filter>
        <filter
          id="nnneon-filter2"
          x="-100%"
          y="-100%"
          width="400%"
          height="400%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            stdDeviation="10 17"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            in="SourceGraphic"
            edgeMode="none"
            result="blur"
          />
        </filter>
      </defs>
      <g clipPath="url(#58708a0c3a)">
        <path
          fill="url(#nnneon-grad)"
          d="M 80.019531 0.0859375 L 191.648438 0.0859375 L 144.414062 88.105469 L 202.378906 88.105469 L 62.128906 299.910156 L 99.335938 143.910156 L 28.496094 143.910156 L 80.019531 0.0859375 "
          fillOpacity="1"
          fillRule="nonzero"
        />
        <path
          filter="url(#nnneon-filter)"
          fill="url(#nnneon-grad)"
          d="M 80.019531 0.0859375 L 191.648438 0.0859375 L 144.414062 88.105469 L 202.378906 88.105469 L 62.128906 299.910156 L 99.335938 143.910156 L 28.496094 143.910156 L 80.019531 0.0859375 "
          fillOpacity="1"
          fillRule="nonzero"
          opacity="0.3"
        />
        <path
          filter="url(#nnneon-filter2)"
          fill="url(#nnneon-grad)"
          d="M 80.019531 0.0859375 L 191.648438 0.0859375 L 144.414062 88.105469 L 202.378906 88.105469 L 62.128906 299.910156 L 99.335938 143.910156 L 28.496094 143.910156 L 80.019531 0.0859375 "
          fillOpacity="1"
          opacity="0.2"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
};
