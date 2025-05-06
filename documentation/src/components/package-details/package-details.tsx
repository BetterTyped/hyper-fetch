import { useClipboard, useIsMounted } from "@reins/hooks";
import { Copy } from "lucide-react";
import { useState } from "react";

export const PackageDetails = ({
  icon: Icon,
  name,
  pkg,
  featured = false,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  name?: string;
  pkg: string | string[];
  featured?: boolean;
}) => {
  const isMounted = useIsMounted();
  const [done, setDone] = useState(false);

  const { copy } = useClipboard({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        if (isMounted) {
          setDone(false);
        }
      }, 1000);
    },
    onError: () => {},
  });

  const npmInstall = `${Array.isArray(pkg) ? pkg.join(" ") : pkg}`;
  const names = name || (Array.isArray(pkg) ? pkg.map((el) => el.split("/")[1]).join(", ") : pkg.split("/")[1]);

  return (
    <div className="package-wrapper mb-6">
      <div className="package-details w-full max-w-full bg-gradient-to-tr from-zinc-50 to-zinc-100/25 dark:from-zinc-800/30 dark:to-zinc-900/5 rounded-3xl border dark:border-zinc-800">
        <div className="px-2 pt-4 pb-6">
          <div className="text-center">
            <div className="relative inline-flex">
              <Icon className="w-10 h-10" />
              {featured && (
                <img
                  className="absolute -top-1 -right-1"
                  src="/img/star.svg"
                  width={16}
                  height={16}
                  alt="Star"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="text-zinc-500 dark:text-zinc-300 font-medium capitalize mb-1">{names}</div>
            <button
              type="button"
              onClick={() => copy(npmInstall)}
              className="flex justify-between items-center shiny-btn mb-2 !py-1 !px-3 text-zinc-300 hover:text-white transition duration-150 ease-in-out group max-w-[90%] mx-auto"
            >
              <span className="relative inline-flex items-center hover:text-white text-[13px] overflow-x-auto text-ellipsis max-w-[90%] whitespace-nowrap">
                {npmInstall}
              </span>
              <Copy className="w-[12px] ml-2 stroke-yellow-500 transition duration-150 ease-in-out" />
              {done && (
                <div className="absolute -bottom-1 translate-y-full left-1/2 -translate-x-1/2 text-[13px] opacity-60 ml-2 whitespace-nowrap">
                  Copied to clipboard!
                </div>
              )}
            </button>
            <div className="relative flex justify-center items-center z-10">
              <a
                className="text-blue-500 font-medium flex items-center space-x-1 text-xs"
                href={`https://www.npmjs.com/package/${pkg}`}
                rel="noreferrer"
                target="_blank"
              >
                <span className="text-xs">npm.com</span>
                <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="9" height="9">
                  <path d="m1.285 8.514-.909-.915 5.513-5.523H1.663l.01-1.258h6.389v6.394H6.794l.01-4.226z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
