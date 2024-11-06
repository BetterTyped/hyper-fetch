import { useEffect } from "react";
import Swiper, { Autoplay } from "swiper";
import { Particles } from "@site/src/components/particles";
import Client01 from "@site/static/img/client-01.svg";
import Client02 from "@site/static/img/client-02.svg";
import Client03 from "@site/static/img/client-03.svg";
import Client04 from "@site/static/img/client-04.svg";
import Client05 from "@site/static/img/client-05.svg";
import Client06 from "@site/static/img/client-06.svg";
import "swiper/swiper.min.css";

Swiper.use([Autoplay]);

export const Clients = () => {
  useEffect(() => {
    const carousel = new Swiper(".clients-carousel", {
      slidesPerView: "auto",
      spaceBetween: 64,
      centeredSlides: true,
      loop: true,
      speed: 5000,
      noSwiping: true,
      noSwipingClass: "swiper-slide",
      autoplay: {
        delay: 0,
        disableOnInteraction: true,
      },
    });
    return () => {
      carousel.destroy?.();
    };
  }, []);

  return (
    <section className="container mx-auto px-4 sm:px-6 flex flex-col justify-center h-[220px]">
      <div className="text-center text-base mb-10 max-w-[460px] mx-auto font-normal">
        Companies that use{" "}
        <a href="https://bettertyped.com" className="text-blue-500 font-semibold">
          BetterTyped
        </a>{" "}
        open-source software.
      </div>
      <div className="relative h-[60px]">
        {/* Particles animation */}
        <div className="absolute inset-0 max-w-6xl mx-auto px-4 sm:px-6">
          <Particles className="absolute inset-0 -z-10" quantity={5} />
        </div>

        <div className="overflow-hidden">
          {/* Carousel built with Swiper.js [https://swiperjs.com/] */}
          {/* * Custom styles in src/css/additional-styles/theme.scss */}
          <div className="clients-carousel swiper-container relative before:absolute before:inset-0 before:w-32 before:z-10 before:pointer-events-none before:bg-gradient-to-r before:from-[var(--background)] after:absolute after:inset-0 after:left-auto after:w-32 after:z-10 after:pointer-events-none after:bg-gradient-to-l after:from-[var(--background)]">
            <div className="swiper-wrapper !ease-linear select-none items-center">
              {/* Carousel items */}
              <div className="swiper-slide !w-auto">
                <Client01 className="w-[100px] h-auto max-h-[30px] object-cover fill-zinc-700 dark:fill-zinc-300" />
              </div>
              <div className="swiper-slide !w-auto">
                <Client02 className="w-[100px] h-auto max-h-[30px] object-cover fill-zinc-700 dark:fill-zinc-300" />
              </div>
              <div className="swiper-slide !w-auto">
                <Client03 className="w-[100px] h-auto max-h-[30px] object-cover fill-zinc-700 dark:fill-zinc-300" />
              </div>
              <div className="swiper-slide !w-auto">
                <Client04 className="w-[100px] h-auto max-h-[30px] object-cover fill-zinc-700 dark:fill-zinc-300" />
              </div>
              <div className="swiper-slide !w-auto">
                <Client05 className="w-[100px] h-auto max-h-[30px] object-cover fill-zinc-700 dark:fill-zinc-300" />
              </div>
              <div className="swiper-slide !w-auto">
                <Client06 className="w-[100px] h-auto max-h-[30px] object-cover fill-zinc-700 dark:fill-zinc-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
