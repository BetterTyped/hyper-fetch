/* eslint-disable react/no-array-index-key */
import { Title } from "@site/src/components";
import { CodeIcon, LucideProps } from "lucide-react";

import { IntegrationCard } from "../card/card";
import { integrations } from "../integrations.constants";

const categories = integrations.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [item];
  } else {
    acc[item.category].push(item);
  }

  return acc;
}, {});

const categoriesKeys = Object.keys(categories);

const icons: Record<
  string,
  React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
> = {
  Tools: CodeIcon,
  Adapters: CodeIcon,
  Service: CodeIcon,
};

export function IntegrationsList() {
  return (
    <section className="mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          <div className="flex justify-between items-center py-6 border-b [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300),transparent)1] dark:[border-image:linear-gradient(to_right,transparent,theme(colors.slate.800),transparent)1] space-x-8 overflow-x-scroll no-scrollbar">
            <div className="flex flex-wrap items-center text-md font-medium space-x-8">
              {categoriesKeys.map((category, index) => {
                const Icon = icons[category];
                return (
                  <a
                    key={index}
                    className="flex gap-2 items-center text-slate-500 hover:text-slate-400 dark:text-slate-50 dark:hover:text-white stroke-slate-50 whitespace-nowrap transition-colors space-x-2"
                    href={`#${category.toLocaleLowerCase()}`}
                  >
                    {Icon ? <Icon className="w-5 h-5" /> : <CodeIcon className="w-5 h-5" />}
                    {category}
                  </a>
                );
              })}
            </div>
          </div>
          {categoriesKeys.map((key) => (
            <div className="mt-12 md:mt-16" key={key}>
              <Title size="sm" id={key.toLocaleLowerCase()} wrapperClass="scroll-mt-8 pb-8">
                {key}
              </Title>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories[key].map((item, index) => (
                  <IntegrationCard item={item} key={index} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
