import { Description, Particles, Title } from "@site/src/components";

import { IntegrationsList } from "./list/list";
import { PromotedCarousel } from "./promoted-carousel/promoted-carousel";

const styles = `
.theme-doc-breadcrumbs, article header, .theme-doc-version-badge {
  display: none!important;
}
main > div > .row > .col {
  width: 100%!important;
  max-width: none!important;
}
`;

export const Integrations = () => {
  return (
    <>
      <style>{styles}</style>
      <div className="relative opacity-90 dark:opacity-100 -z-10">
        {/* Graphic 02 */}
        <div
          className="md:block absolute left-1/2 -translate-x-1/2 bottom-0 -mb-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <img src="/img/page-illustration-02.svg" width={1440} height={427} alt="Page Graphic 02" />
        </div>

        {/* Opacity layer */}
        <div className="absolute inset-0 bg-slate-900 opacity-60 -z-10" aria-hidden="true" />

        {/* Radial gradient */}
        <div
          className="absolute flex items-center justify-center top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-[800px] aspect-square max-w-[100vw]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 translate-z-0 bg-yellow-500 dark:bg-yellow-700 rounded-full blur-[120px] opacity-30" />
          <div className="absolute w-64 h-64 translate-z-0 bg-yellow-400 dark:bg-yellow-900 rounded-full blur-[80px] opacity-60" />
        </div>

        {/* Particles animation */}
        <Particles className="absolute inset-0 h-96 -z-10" quantity={15} />

        {/* Graphic */}
        <div
          className="md:block absolute left-1/2 -translate-x-1/2 -mt-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <img src="/img/page-illustration.svg" width={1440} height={427} alt="Page Graphic" />
        </div>
      </div>
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-6 md:pt-12">
          <div className="text-center pb-4 md:pb-8">
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
          <PromotedCarousel />
        </div>
      </section>

      <IntegrationsList />

      <div className="px-4 mb-20 flex flex-col items-center">
        <Title size="sm" className="text-center">
          Have an idea for new integrations?
        </Title>
        <Description className="text-lg text-slate-400 text-center">
          Create and add your own integrations. Place it on this page by creating a Pull Request on github. <br />
          If you have an idea for a new integration, open a new issue and let us know what you need.
        </Description>
        <div>
          <a
            href="https://github.com/BetterTyped/hyper-fetch/issues"
            className="!no-underline bg-gradient-to-br justify-center from-orange-500 via-yellow-600 to-yellow-500 !text-white font-semibold rounded-xl p-[2px] max-w-[100vw] text-center text-sm md:text-md py-3 px-5 md:py-3 md:px-10 flex items-center hover:from-yellow-400 hover:to-yellow-400 dark:hover:from-yellow-100 dark:hover:to-yellow-100 hover:text-white dark:hover:text-black transition-all"
          >
            Let us know!
          </a>
        </div>
      </div>
    </>
  );
};