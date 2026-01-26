"use client";
import CustomSwiper from "@/app/ui/Swiper";
import Image from "next/image";

export default function HomeSwiper() {
  return (
    <div className="[&_.swiper-pagination-bullet-active]:bg-color1">
      <div className="hidden max-[600px]:hidden md:block">
        <CustomSwiper
          slides={Array.from({ length: 4 }).map((_, i) => (
            <Image
              key={i}
              src={`/home/banners/bannerPc${i + 1}.jpg`}
              alt=""
              width={1920}
              height={1000}
              quality={100}
              className="h-[50vh] w-full"
            />
          ))}
          initialSlide={0}
          slidesPerView={1}
          pagination
          loop
          allowTouchMove
          speed={1500}
          autoplay={{
            delay: 5000,
            disableOnInteraction: true,
          }}
        />
      </div>
      <div className="block max-[600px]:block md:hidden">
        <CustomSwiper
          slides={Array.from({ length: 4 }).map((_, i) => (
            <Image
              key={i}
              src={`/home/banners/bannerPhone${i + 1}.jpg`}
              alt=""
              width={1920}
              height={1000}
              className="h-[50vh] w-full"
            />
          ))}
          initialSlide={0}
          slidesPerView={1}
          pagination
          loop
          allowTouchMove
          speed={1500}
          autoplay={{
            delay: 5000,
            disableOnInteraction: true,
          }}
        />
      </div>
    </div>
  );
}
