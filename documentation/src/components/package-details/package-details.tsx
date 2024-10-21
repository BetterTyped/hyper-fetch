import { useClipboard, useIsMounted } from "@reins/hooks";
import { Copy } from "lucide-react";
import { useState } from "react";

const styles = `
@media (min-width: 1200px) {
  article {
    position: relative;
    padding-right: 350px;
  }
  .package-wrapper {
    position: absolute;
    right: 0;
    top: 0;
    height: calc(100% - 150px);
  }
  .package-details {
    position: sticky;
    top: 120px;
  }
}
`;

export const PackageDetails = ({ pkg }: { pkg: string | string[] }) => {
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

  const npmInstall = `npm i ${Array.isArray(pkg) ? pkg.join(" ") : pkg}`;
  const names = Array.isArray(pkg) ? pkg.map((el) => el.split("/")[1]).join(", ") : pkg.split("/")[1];

  return (
    <div className="package-wrapper">
      <div className="package-details w-[320px] max-w-full bg-gradient-to-tr from-slate-50 to-slate-100/25 dark:from-slate-800 dark:to-slate-800/25 rounded-3xl border dark:border-slate-800">
        <style>{styles}</style>
        <div className="px-5 py-6">
          <div className="text-center mb-5">
            <div className="mb-4">
              <div className="relative inline-flex">
                <img src="/img/integrations-github.svg" width={80} height={80} alt="Icon 08" />
                <img
                  className="absolute top-0 -right-1"
                  src="/img/star.svg"
                  width={24}
                  height={24}
                  alt="Star"
                  aria-hidden="true"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => copy(npmInstall)}
              className="flex justify-between items-center shiny-btn mb-2 !py-2 !px-4 text-slate-300 hover:text-white transition duration-150 ease-in-out group max-w-[90%] mx-auto"
            >
              <span className="relative inline-flex items-center hover:text-white overflow-x-auto text-ellipsis max-w-[90%] whitespace-nowrap">
                {npmInstall}
              </span>
              <Copy className="w-[15px] ml-2 fill-blue-500 transition duration-150 ease-in-out" />
              {done && (
                <div className="absolute -bottom-1 translate-y-full left-1/2 -translate-x-1/2 text-xs opacity-60 ml-2 whitespace-nowrap">
                  Copied to clipboard!
                </div>
              )}
            </button>
          </div>
          <ul className="text-sm !pl-0">
            <li className="flex items-center justify-between space-x-2 py-3 border-t [border-image:linear-gradient(to_right,theme(colors.slate.300/.3),theme(colors.slate.300),theme(colors.slate.300/.3))1] dark:[border-image:linear-gradient(to_right,theme(colors.slate.700/.3),theme(colors.slate.700),theme(colors.slate.700/.3))1]">
              <span className="text-slate-400">Name</span>
              <span className="text-slate-500 dark:text-slate-300 font-medium capitalize">{names}</span>
            </li>
            <li className="flex items-center justify-between space-x-2 py-3 border-t [border-image:linear-gradient(to_right,theme(colors.slate.300/.3),theme(colors.slate.300),theme(colors.slate.300/.3))1] dark:[border-image:linear-gradient(to_right,theme(colors.slate.700/.3),theme(colors.slate.700),theme(colors.slate.700/.3))1]">
              <span className="text-slate-400">Website</span>
              {Array.isArray(pkg) ? (
                <div className="flex flex-wrap gap-3">
                  {pkg.map((el, index) => (
                    <a
                      className="text-blue-500 font-medium flex items-center space-x-1 mr-2"
                      href={`https://www.npmjs.com/package/${el}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="capitalize">{names.split(", ")[index]}</span>
                      <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="9" height="9">
                        <path d="m1.285 8.514-.909-.915 5.513-5.523H1.663l.01-1.258h6.389v6.394H6.794l.01-4.226z" />
                      </svg>
                    </a>
                  ))}
                </div>
              ) : (
                <a
                  className="text-blue-500 font-medium flex items-center space-x-1"
                  href={`https://www.npmjs.com/package/${pkg}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>npm.com</span>
                  <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="9" height="9">
                    <path d="m1.285 8.514-.909-.915 5.513-5.523H1.663l.01-1.258h6.389v6.394H6.794l.01-4.226z" />
                  </svg>
                </a>
              )}
            </li>
            {/* <li className="flex items-center justify-between space-x-2 py-3 border-t [border-image:linear-gradient(to_right,theme(colors.slate.300/.3),theme(colors.slate.300),theme(colors.slate.300/.3))1] dark:[border-image:linear-gradient(to_right,theme(colors.slate.700/.3),theme(colors.slate.700),theme(colors.slate.700/.3))1]">
              <span className="text-slate-400">Installs</span>
              <span className="text-slate-500 dark:text-slate-300 font-medium relative p3">
                {loading && <div className="dot-elastic mr-3" />}
                {!loading && (data?.downloads || "--")}
              </span>
            </li> */}
          </ul>
        </div>
      </div>
    </div>
  );
};
