export const PackageDetails = ({
  icon: Icon,
  name,
  pkg,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  name?: string;
  pkg: string | string[];
}) => {
  const names = name || (Array.isArray(pkg) ? pkg.map((el) => el.split("/")[1]).join(", ") : pkg.split("/")[1]);

  return (
    <div className="package-wrapper mb-6">
      <div className="package-details w-fit min-w-[180px] max-w-full bg-gradient-to-tr from-zinc-50 to-zinc-100/25 dark:from-zinc-800/90 dark:to-zinc-900/85 rounded-lg border dark:border-zinc-800">
        <div className="pl-5 pr-8 pt-2 pb-2">
          <div className="text-start w-fit">
            <div className="relative inline-flex items-center gap-2 text-lg w-fit">
              <Icon className="w-6 h-6" />
              {names}
            </div>
            <div className="relative flex justify-start items-center z-10 pl-8 -mt-1">
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
