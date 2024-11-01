/* eslint-disable react/no-array-index-key */
import { Highlighter, Title } from "@site/src/components";

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

const icons = [
  <svg className="fill-slate-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <path d="m7.7 7.3-5-5c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4L5.6 8l-4.3 4.3c-.4.4-.4 1 0 1.4.2.2.4.3.7.3.3 0 .5-.1.7-.3l5-5c.4-.4.4-1 0-1.4ZM8 12h7v2H8z" />
  </svg>,
  <svg className="fill-slate-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <path d="M10 15c-.4 0-.8-.3-.9-.7L5.8 4.6 3.9 8.4c-.2.4-.5.6-.9.6H0V7h2.4l2.7-5.4c.2-.4.6-.6 1-.6s.7.3.9.7l3.2 9.7 1.9-3.8c.2-.4.5-.6.9-.6h3v2h-2.4l-2.7 5.4c-.2.4-.5.6-.9.6Z" />
  </svg>,
  <svg className="fill-slate-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <path d="M7.3 9.7c-.4-.4-.4-1 0-1.4l7-7c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-7 7c-.4.4-1 .4-1.4 0ZM7.3 15.7c-.4-.4-.4-1 0-1.4l7-7c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-7 7c-.4.4-1 .4-1.4 0ZM.3 10.7c-.4-.4-.4-1 0-1.4l7-7c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-7 7c-.4.4-1 .4-1.4 0Z" />
  </svg>,
  <svg className="fill-slate-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <path d="M11.505 14.135a1 1 0 0 1 .175-1.403A5.967 5.967 0 0 0 14 8c0-3.309-2.691-6-6-6S2 4.691 2 8c0 1.858.846 3.583 2.32 4.731a1 1 0 0 1-1.228 1.578A7.951 7.951 0 0 1 0 8c0-4.411 3.589-8 8-8s8 3.589 8 8a7.955 7.955 0 0 1-3.092 6.31 1.001 1.001 0 0 1-1.403-.175Z" />
    <path d="M9.045 10.973a1 1 0 0 1 .175-1.404A1.98 1.98 0 0 0 10 8c0-1.103-.897-2-2-2s-2 .897-2 2c0 .611.284 1.184.78 1.569a1 1 0 1 1-1.228 1.578A3.967 3.967 0 0 1 4 8c0-2.206 1.794-4 4-4s4 1.794 4 4c0 1.232-.565 2.38-1.552 3.147a.999.999 0 0 1-1.403-.174Z" />
  </svg>,
];

export function IntegrationsList() {
  return (
    <section className="mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          {/* Tobpabr */}
          <div className="flex justify-between items-center py-6 border-b [border-image:linear-gradient(to_right,transparent,theme(colors.slate.300),transparent)1] dark:[border-image:linear-gradient(to_right,transparent,theme(colors.slate.800),transparent)1] space-x-8 overflow-x-scroll no-scrollbar">
            {/* Links */}
            <ul className="flex flex-nowrap text-sm font-medium space-x-8">
              {categoriesKeys.map((category, index) => (
                <li key={index}>
                  <a
                    className="flex items-center text-slate-50 hover:text-white whitespace-nowrap transition-colors space-x-2"
                    href={`#${category.toLocaleLowerCase()}`}
                  >
                    {icons[index]}
                    <span>{category}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cards */}
          <Highlighter>
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
          </Highlighter>
        </div>
      </div>
    </section>
  );
}
