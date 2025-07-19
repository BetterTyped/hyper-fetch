import { Description, HighlighterItem, Title } from "@site/src/components";
import { ArrowRight } from "lucide-react";
import { cn } from "@site/src/lib/utils";
import { motion } from "motion/react";

export const MediumBlock = ({
  img,
  title,
  description,
}: {
  img: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <motion.div
      className="w-full h-full overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <HighlighterItem>
        <div
          className={cn(
            "relative bg-zinc-50 dark:bg-zinc-900/80 h-full rounded-[inherit] z-20 overflow-hidden bg-with-noise",
            "transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
          )}
        >
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] h-full">
              <div className="flex flex-col justify-between md:max-w-[480px] shrink-0 order-1 md:order-none px-6 py-4 md:px-8 md:py-4 h-full">
                <div className="mt-4 flex-1">
                  <Title size="none" wrapperClass="inline-flex flex-wrap font-bold pb-1" className="text-2xl">
                    {title}
                  </Title>
                  <Description size="none" className="text-zinc-400">
                    {description}
                  </Description>
                </div>
                <span className="text-zinc-400 text-sm flex gap-1 items-center">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="hidden md:block absolute md:relative w-full h-full overflow-hidden -z-[1] opacity-30 md:opacity-100">
                {img}
              </div>
            </div>
          </div>
        </div>
      </HighlighterItem>
    </motion.div>
  );
};
