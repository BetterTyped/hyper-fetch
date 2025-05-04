/* eslint-disable react/no-array-index-key */
import { Title } from "@site/src/components";
import { Code, LucideProps, PlugZap, Server, Usb, Users } from "lucide-react";
import { integrations } from "@site/src/integrations";

import { IntegrationCard } from "../card/card";

const categories = integrations
  .filter((section) => section.isPackage)
  .reduce((acc, item) => {
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
  Plugin: PlugZap,
  Tools: Code,
  Adapters: Usb,
  Service: Server,
  Community: Users,
};

export function IntegrationsList() {
  return (
    <section>
      <div className="pb-6 md:pb-10">
        <div className="flex justify-between items-center py-6 border-b-0 [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300),transparent)1] dark:[border-image:linear-gradient(to_right,transparent,theme(colors.slate.800),transparent)1] space-x-8 overflow-x-scroll no-scrollbar">
          <div className="flex flex-wrap items-center text-md font-medium space-x-8">
            {categoriesKeys.map((category, index) => {
              const Icon = icons[category];
              return (
                <a
                  key={index}
                  className="flex gap-2 items-center text-slate-500 hover:text-slate-400 dark:text-slate-50 dark:hover:text-white stroke-slate-50 whitespace-nowrap transition-colors space-x-2"
                  href={`#${category.toLocaleLowerCase()}`}
                >
                  {Icon ? <Icon className="brightness-50 w-5 h-5" /> : <Code className="brightness-50 w-5 h-5" />}
                  {category}
                </a>
              );
            })}
          </div>
        </div>
        {categoriesKeys.map((key) => (
          <div className="mt-4 md:mt-6" key={key}>
            <Title size="sm" id={key.toLocaleLowerCase()} wrapperClass="scroll-mt-8 pb-4 mt-4">
              {key}
            </Title>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories[key].map((section, index) => (
                <IntegrationCard section={section} key={index} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
