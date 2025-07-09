export const PackageDetails = ({
  icon: Icon,
  name,
  pkg,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  name?: string;
  pkg: string;
}) => {
  const packageName = name || pkg.split("/")[1];

  return (
    <div className="package-wrapper mb-6">
      <div className="package-details min-w-fit w-[270px] max-w-full bg-gradient-to-tr from-zinc-50 to-zinc-100/25 dark:from-zinc-800/90 dark:to-zinc-900/85 rounded-lg border dark:border-zinc-700/80">
        <div className="pl-3 pr-3 pt-2 pb-2 flex items-center gap-3">
          <Icon className="w-8 h-8 mt-0.5" />
          <div className="text-start w-fit">
            <div className="relative inline-flex items-center gap-2 text-base w-fit">{packageName}</div>
            <div className="relative flex justify-start items-center z-10 -mt-0.5 gap-3">
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
