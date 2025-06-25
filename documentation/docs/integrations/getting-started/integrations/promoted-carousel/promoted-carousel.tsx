import { useCallback, useRef } from "react";
import { integrations } from "@site/src/integrations";
import { Swiper, SwiperSlide, SwiperRef } from "swiper/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "swiper/css";

import { IntegrationCard } from "../card/card";

export const PromotedCarousel = () => {
  const sliderRef = useRef<SwiperRef>(null);

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slideNext();
  }, []);

  return (
    <>
      <Swiper
        ref={sliderRef}
        spaceBetween={50}
        breakpoints={{
          320: {
            slidesPerView: 1,
          },
          640: {
            slidesPerView: 2,
          },
          1280: {
            slidesPerView: 3,
          },
        }}
        autoplay={{
          delay: 2500,
        }}
      >
        {integrations
          .filter((section) => section.isPackage && section.featured)
          .map((section) => (
            <SwiperSlide key={section.label}>
              <IntegrationCard className="h-full" section={section} />
            </SwiperSlide>
          ))}
      </Swiper>

      {/* Arrows */}
      <div className="flex pt-4 justify-end">
        <button
          type="button"
          onClick={handlePrev}
          className="carousel-prev relative z-20 w-12 h-12 flex items-center justify-center group"
        >
          <span className="sr-only">Previous</span>
          <ArrowLeft className="w-6 h-6 stroke-slate-500 group-hover:stroke-yellow-500 transition duration-150 ease-in-out" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="carousel-next relative z-20 w-12 h-12 flex items-center justify-center group"
        >
          <span className="sr-only">Next</span>
          <ArrowRight className="w-6 h-6 stroke-slate-500 group-hover:stroke-yellow-500 transition duration-150 ease-in-out" />
        </button>
      </div>
    </>
  );
};
