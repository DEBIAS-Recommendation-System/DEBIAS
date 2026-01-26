"use client";
import React from "react";
import { Pagination, Navigation, Virtual, Autoplay } from "swiper/modules";
import { Swiper, SwiperProps, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
export default function CustomSwiper(
  props: SwiperProps & {
    slides: React.ReactNode[];
    setActiveIndex?: React.Dispatch<React.SetStateAction<number>>;
  },
) {
  return (
    <Swiper
      className="w-full"
      {...props}
      modules={[Virtual, Pagination, Navigation, Autoplay]}
      slidesPerGroupSkip={props.slidesPerGroupSkip ?? 3}
      pagination={props.pagination ? { clickable: true } : false}
      onSwiper={(swiper) => {
        swiper.updateSize();
        swiper.update();
      }}
      onRealIndexChange={(element) =>
        props.setActiveIndex?.(element.activeIndex)
      }
    >
      {props.slides?.map((slide: any, index: number) => (
        <SwiperSlide key={"slide" + index} className="h-min w-min">
          {slide}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
