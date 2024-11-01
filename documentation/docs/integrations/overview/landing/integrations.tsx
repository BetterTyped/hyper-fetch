import { Description, Highlighter, Particles, Title } from "@site/src/components";

import { IntegrationCard } from "./card/card";
import { integrations } from "./integrations.constants";
import { IntegrationsList } from "./list/list";

const styles = `
aside, .theme-doc-breadcrumbs, article header, .theme-doc-version-badge {
  display: none!important;
}
main, main .col {
  width: 100%!important;
  max-width: 100%!important;
}
`;

export const Integrations = () => {
  return (
    <>
      <style>{styles}</style>
      <div className="relative opacity-90 dark:opacity-100 -z-10">
        {/* Illustration 02 */}
        <div
          className="md:block absolute left-1/2 -translate-x-1/2 bottom-0 -mb-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <img src="/img/page-illustration-02.svg" width={1440} height={427} alt="Page Illustration 02" />
        </div>

        {/* Opacity layer */}
        <div className="absolute inset-0 bg-slate-900 opacity-60 -z-10" aria-hidden="true" />

        {/* Radial gradient */}
        <div
          className="absolute flex items-center justify-center top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-[800px] aspect-square max-w-[100vw]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 translate-z-0 bg-yellow-500 rounded-full blur-[120px] opacity-30" />
          <div className="absolute w-64 h-64 translate-z-0 bg-yellow-400 rounded-full blur-[80px] opacity-70" />
        </div>

        {/* Particles animation */}
        <Particles className="absolute inset-0 h-96 -z-10" quantity={15} />

        {/* Illustration */}
        <div
          className="md:block absolute left-1/2 -translate-x-1/2 -mt-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <img src="/img/page-illustration.svg" width={1440} height={427} alt="Page Illustration" />
        </div>
      </div>
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-32 md:pt-40">
          {/* Section header */}
          <div className="text-center pb-12 md:pb-20">
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-yellow-200 pb-3">
              Integrations & Add-ons
            </div>
            <Title>Make it uniquely yours</Title>
            <div className="max-w-xl mx-auto">
              <Description className="text-lg text-slate-400">
                Unlock the full potential of your workflow, ensuring a cohesive and productive environment.
              </Description>
            </div>
          </div>

          <Highlighter className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-20">
            <IntegrationCard item={integrations[0]} />
            <IntegrationCard item={integrations[1]} />
            <IntegrationCard item={integrations[2]} />
          </Highlighter>
        </div>
      </section>
      <IntegrationsList />

      <div className="px-4 mb-20 flex flex-col items-center">
        <Title size="sm" className="text-center">
          Have an idea for new integrations?
        </Title>
        <Description className="text-lg text-slate-400">
          Open a new issue on our repository, we will be extremely grateful for it!
        </Description>
        <div>
          <a
            href="https://github.com/BetterTyped/hyper-fetch/issues"
            className="!no-underline bg-gradient-to-br justify-center from-orange-500 via-yellow-600 to-yellow-500 text-white font-semibold rounded-xl p-[2px] max-w-[100vw] text-center text-sm md:text-md py-3 px-5 md:py-3 md:px-10 flex items-center hover:from-yellow-400 hover:to-yellow-400 dark:hover:from-yellow-100 dark:hover:to-yellow-100 hover:text-white dark:hover:text-black transition-all"
          >
            Let us know!
          </a>
        </div>
      </div>
    </>
  );
};
