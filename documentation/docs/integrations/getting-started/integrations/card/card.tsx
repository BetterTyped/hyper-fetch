import Link from "@docusaurus/Link";
import { Description, DocsCard, Noise, Title } from "@site/src/components";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { Section } from "@site/src/modules";
import clsx from "clsx";

export type CardProps = {
  section: Section;
  className?: string;
};

export function IntegrationCard({ section, className }: CardProps) {
  const { sidebar } = useSidebar();

  const item = sidebar.find((element) => element.section.label === section.label);

  return (
    <Link to={item.link.path} className={clsx(className)}>
      <DocsCard className="flex flex-col p-5 h-full">
        <Noise visibility="medium" />
        <div className="flex items-center space-x-3 mb-2">
          {item.section.img && (
            <div className="relative mr-2">
              <item.img
                width="40"
                height="40"
                style={{ background: "radial-gradient(#fff 68%, #3a373722 72%)" }}
                className={`w-[38px] h-[38px] border-0 rounded-full overflow-hidden p-1.5 ${item.section.icon || ""}`}
              />
              {item.section.featured && (
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
      </DocsCard>
    </Link>
  );
}
