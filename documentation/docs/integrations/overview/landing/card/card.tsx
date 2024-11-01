import Link from "@docusaurus/Link";
import { Description, HighlighterItem, Title } from "@site/src/components";
import clsx from "clsx";

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

export function IntegrationCard({ item, className }: CardProps) {
  return (
    <Link to={item.link}>
      <HighlighterItem className={clsx(className)}>
        <div className="flex flex-col p-6 h-full">
          <div className="flex items-center space-x-3 mb-3">
            {item.img && (
              <div className="relative mr-2">
                <img
                  src={item.img}
                  alt={item.name}
                  width="40"
                  height="40"
                  style={{ background: "radial-gradient(#fff 68%, #3a373722 72%)" }}
                  className={`w-[40px] h-[40px] border-0 rounded-full overflow-hidden p-2 ${item.className || ""}`}
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
            <Title size="none" className="font-semibold pb-2">
              {item.name}
            </Title>
          </div>
          <div className="grow mb-3">
            <Description size="none" className="text-sm !m-0">
              {item.description}
            </Description>
          </div>
        </div>
      </HighlighterItem>
    </Link>
  );
}
