import { SVGProps } from "react";

export const Background = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 1920 1920"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="Red-Yellow-Vibrant--Streamline-Gradient-Bg"
      height="250"
      width="250"
      strokeWidth="1"
      {...props}
    >
      <desc>Red Yellow Vibrant Streamline Element: https://streamlinehq.com</desc>
      <path fill="url(#paint0_linear_121_101)" d="M0 1h1920v1920H0Z" />
      <defs>
        <linearGradient
          id="paint0_linear_121_101"
          x1="400.217"
          y1="292.89"
          x2="2155.9"
          y2="1493.77"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5d4a37" />
          <stop offset="1" stopColor="#2a375c" />
        </linearGradient>
      </defs>
    </svg>
  );
};
