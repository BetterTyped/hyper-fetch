import { Description, FadeIn, Title } from "@site/src/components";

export const Sponsors = () => {
  return (
    <section className="relative pb-20 ">
      <div className="max-w-3xl mx-auto text-center">
        <FadeIn start={0.05} end={0.25}>
          <div>
            <div className="inline-flex font-medium bg-clip-text !text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-500 dark:to-orange-200 pb-3">
              Support the development.
            </div>
          </div>
        </FadeIn>
        <FadeIn start={0} end={0.2}>
          <Title wrapperClass="h2 bg-clip-text !text-transparent bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 pb-4">
            Our wonderful sponsors
          </Title>
        </FadeIn>
        <FadeIn start={0.05} end={0.3}>
          <Description size="none" className="text-lg">
            We&apos;re grateful to the following companies and individuals who have supported us financially. You can
            still help us by joining the{" "}
            <a target="_blank" rel="noreferrer" href="https://github.com/sponsors/prc5">
              GitHub Sponsors program
            </a>{" "}
            or <a href="mailto:maciekpyrc@gmail.com">contact us</a> for other ways of support or collaboration.
          </Description>
        </FadeIn>
      </div>
      <FadeIn start={0.1} end={0.4}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <a href="https://github.com/sponsors/prc5">
            <img
              src="https://github.com/prc5/sponsors/blob/main/packages/all/sponsorkit/sponsors.png?raw=true"
              alt="My Sponsors"
              className="max-w-[900px] mx-auto w-full"
            />
          </a>
        </div>
      </FadeIn>
    </section>
  );
};
