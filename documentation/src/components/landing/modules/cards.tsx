/* eslint-disable react/no-array-index-key */
import { useEffect, useRef } from "react";
import SwiperLib, { Autoplay } from "swiper";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { Description, Title } from "@site/src/components";
import Link from "@docusaurus/Link";
import { ArrowRight } from "lucide-react";
import { cn } from "@site/src/lib/utils";
import { motion } from "motion/react";
import "swiper/swiper.min.css";

SwiperLib.use([Autoplay]);

export const Cards = () => {
  const { sidebar } = useSidebar({ showAllPackages: true });
  const swiperRef = useRef<SwiperLib | null>(null);
  const excludeFromPromoted = ["eslint"];

  const list = sidebar.filter(
    (item) => !excludeFromPromoted.some((exclude) => item.name.toLowerCase().includes(exclude)),
  );

  useEffect(() => {
    swiperRef.current = new SwiperLib(".modules-carousel", {
      slidesPerView: 1,
      spaceBetween: 24,
      centeredSlides: false,
      loop: true,
      speed: 8000,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
      },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
    return () => {
      swiperRef.current?.destroy?.();
    };
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="overflow-hidden">
          <div className="modules-carousel swiper-container relative before:absolute before:inset-0 before:w-32 before:z-10 before:pointer-events-none before:bg-gradient-to-r before:from-[var(--background)] after:absolute after:inset-0 after:left-auto after:w-32 after:z-10 after:pointer-events-none after:bg-gradient-to-l after:from-[var(--background)]">
            <div className="swiper-wrapper !ease-linear select-none items-stretch">
              {list.map((item, index) => (
                <div key={index} className="swiper-slide !h-auto">
                  <Link to={item.link.path} style={{ textDecoration: "none" }} className="h-full block">
                    <div
                      className={cn(
                        "relative h-full z-20 overflow-hidden rounded-2xl",
                        "bg-zinc-50 dark:bg-zinc-900/80",
                        "transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff10_inset]",
                      )}
                    >
                      <div className="flex flex-col py-6 px-8 h-full bg-with-noise">
                        <div className="flex items-center space-x-3 mb-4">
                          <div
                            className={`${item.section.icon} ${item.section.iconHover} flex items-center size-9 justify-center mr-2 rounded-md ring-1 ring-zinc-900/5 shadow-sm group-hover:shadow group-hover:ring-zinc-900/10 dark:ring-0 dark:shadow-none dark:group-hover:shadow-none dark:group-hover:highlight-white/10 dark:highlight-white/10`}
                          >
                            <item.img className="group-hover:brightness-120 size-6" />
                          </div>
                        </div>
                        <Title
                          size="none"
                          className="font-semibold !leading-[1.2] text-xl"
                          wrapperClass="flex flex-wrap mb-2"
                        >
                          {item.name}
                        </Title>
                        <Description size="none" className="!text-sm !m-0 line-clamp-3 leading-[1.4]">
                          {item.description}
                        </Description>
                        <span className="text-zinc-400 text-sm flex gap-1 items-center mt-5">
                          Learn more <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <div className="flex justify-center items-center w-full mt-10 mb-5">
        <Link to="/docs/integrations/getting-started" className="!no-underline flex items-center gap-2 w-fit text-lg">
          View all integrations <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </>
  );
};
