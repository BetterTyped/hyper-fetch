import Link from "@docusaurus/Link";
import { Description, Title } from "@site/src/components";

export type CardProps = {
  item: {
    link: string;
    category?: string;
    img?: string;
    name: string;
    featured?: boolean;
    description: string;
    className?: string;
  };
  className?: string;
};

export function IntegrationCard({ item }: CardProps) {
  return (
    <Link
      to={item.link}
      className="!no-underline bg-gradient-to-tr from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-800 rounded-3xl border dark:border-zinc-800 dark:hover:border-zinc-700 transition-colors group relative"
    >
      <div className="flex flex-col p-5 h-full">
        <div className="flex items-center space-x-3 mb-2">
          {item.img && (
            <div className="relative mr-2">
              <img
                src={item.img}
                alt={item.name}
                width="40"
                height="40"
                style={{ background: "radial-gradient(#fff 68%, #3a373722 72%)" }}
                className={`w-[38px] h-[38px] border-0 rounded-full overflow-hidden p-1.5 ${item.className || ""}`}
              />
              {item.featured && (
                <img
                  className="absolute top-0 -right-1"
                  src="/img/star.svg"
                  width={16}
                  height={16}
                  alt="Star"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
          <Title size="none" className="font-semibold !no-underline leading-0 h-[20px]" wrapperClass="flex flex-wrap">
            {item.name}
          </Title>
        </div>
        <div className="grow mb-3">
          <Description size="none" className="!text-sm !m-0 !no-underline">
            {item.description}
          </Description>
        </div>
      </div>
    </Link>
  );
}
