import { useEffect, useState } from "react";

/*
 * Monthly npm downloads of every HyperFetch package, summed. Same package list as the README badge.
 * npm's public API does not bulk-query scoped packages, so each package is fetched on its own.
 */
const PACKAGES = [
  "@hyper-fetch/core",
  "@hyper-fetch/react",
  "@hyper-fetch/sockets",
  "@hyper-fetch/cli",
  "@hyper-fetch/graphql",
  "@hyper-fetch/trpc",
  "@hyper-fetch/orpc",
  "@hyper-fetch/hono",
  "@hyper-fetch/elysia",
  "@hyper-fetch/firebase",
  "@hyper-fetch/firebase-admin",
  "@hyper-fetch/axios",
  "@hyper-fetch/plugin-devtools",
  "eslint-plugin-hyper-fetch",
];

const format = (n: number) => {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}k+`;
  return `${n}`;
};

export const useHfMonthlyDownloads = (fallback = "100k+") => {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    let alive = true;
    Promise.all(
      PACKAGES.map((pkg) =>
        fetch(`https://api.npmjs.org/downloads/point/last-month/${pkg}`)
          .then((res) => (res.ok ? res.json() : { downloads: 0 }))
          .then((json: { downloads?: number }) => json.downloads ?? 0)
          .catch(() => 0),
      ),
    ).then((counts) => {
      const total = counts.reduce((sum, n) => sum + n, 0);
      if (alive && total > 0) setValue(format(total));
    });
    return () => {
      alive = false;
    };
  }, []);

  return value;
};
