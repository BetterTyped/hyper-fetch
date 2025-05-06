import { Description, DocsCard, Particles, Title } from "@site/src/components";
import PageIllustration02 from "@site/static/img/page-illustration-02.svg";

import { IntegrationsList } from "./list/list";

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
    <div>
      <style>{styles}</style>
      <div className="relative opacity-90 dark:opacity-100 -z-10 max-w-screen w-screen overflow-x-hidden">
        {/* Graphic 02 */}
        <div
          className="md:block absolute left-1/2 -translate-x-1/2 bottom-0 -mb-16 blur-2xl opacity-90 pointer-events-none -z-10 max-w-[100vw]"
          aria-hidden="true"
        >
          <PageIllustration02 width={1440} height={427} className="text-blue-400" />
        </div>

        {/* Opacity layer */}
        <div className="absolute inset-0 bg-slate-900 opacity-60 -z-10" aria-hidden="true" />

        {/* Radial gradient */}
        <div
          className="absolute flex items-center justify-center top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-[800px] aspect-square max-w-[100vw]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 translate-z-0 bg-blue-500 dark:bg-blue-700 rounded-full blur-[120px] opacity-30" />
          <div className="absolute w-64 h-64 translate-z-0 bg-blue-400 dark:bg-blue-900 rounded-full blur-[80px] opacity-60" />
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
      <section className="">
        <div className="pt-2">
          <div className="text-left">
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-blue-500 to-orange-500 dark:from-blue-500 dark:to-blue-200 pb-3">
              Integrations & Add-ons
            </div>
            <Title>Make it your own</Title>
            <Description className="text-lg text-slate-400">
              Unlock the full potential of your workflow, ensuring a cohesive and productive environment.
            </Description>
          </div>
        </div>
      </section>

      <IntegrationsList />

      <DocsCard className="mb-20 flex flex-col items-center py-10 px-8 w-fit mx-auto">
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
            className="!text-sm !md:text-md !lg:text-lg py-2 px-4 md:py-2 md:px-6 lg:py-2 lg:px-8 flex items-center !no-underline bg-gradient-to-br justify-center from-blue-400 via-blue-500 to-blue-500 text-white dark:text-zinc-800 font-semibold rounded-xl max-w-full text-left hover:from-blue-500 hover:to-blue-400 dark:hover:from-blue-500 dark:hover:to-blue-400 hover:text-white hover:dark:text-zinc-900 transition-all"
          >
            Let us know!
          </a>
        </div>
      </DocsCard>
    </div>
  );
};
