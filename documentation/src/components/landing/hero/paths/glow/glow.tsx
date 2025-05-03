export const Glow = ({ id, path, pathIndex }: { id: number; path: string; pathIndex: number }) => {
  return (
    <g id={`idGlow${pathIndex}`} clipPath="url(#item)">
      <path d={path} stroke={`url(#gradient${id})`} strokeWidth={1.2} mask={`url(#glowMask${id})`} />
      <defs>
        <mask id={`glowMask${id}`}>
          <path d={path} fill="black" />
          <circle id={`halo${id}`} r={100} fill="white" />
        </mask>
        <radialGradient id={`gradient${id}`} r={50} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="yellow" stopOpacity={1} />
          <stop offset="100%" stopColor="yellow" stopOpacity={0} />
        </radialGradient>
      </defs>
    </g>
  );
};
