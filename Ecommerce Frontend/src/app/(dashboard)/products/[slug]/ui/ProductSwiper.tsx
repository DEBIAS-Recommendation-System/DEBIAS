"use client";
import Product from "@/app/(dashboard)/ui/home/ui/ProductsSection/Product";
import CustomSwiper from "@/app/ui/Swiper";
import { IProduct } from "@/types/database.tables.types";
import { MdKeyboardArrowRight } from "react-icons/md";

export function ProductSwiper({
  products,
}: {
  products: (IProduct | null)[] | undefined;
}) {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="relative ml-6 w-full max-w-[75rem] max-[1230px]:max-w-[50rem] max-[880px]:max-w-[35rem]">
        <MdKeyboardArrowRight className="btn_swiper_arrow_left absolute -left-[3.5rem] top-[35%] z-20 size-[3.5rem] rotate-180 cursor-pointer text-slate-700 max-[640px]:hidden" />
        <MdKeyboardArrowRight className="btn_swiper_arrow_right absolute right-0 top-[35%] z-20 size-[3.5rem] cursor-pointer text-slate-700 max-[1230px]:-right-8 max-[640px]:hidden" />
        <CustomSwiper
          loop
          allowTouchMove
          autoplay={{
            delay: 5000,
          }}
          navigation={{
            prevEl: ".btn_swiper_arrow_left",
            nextEl: ".btn_swiper_arrow_right",
          }}
          slidesPerView={4}
          breakpoints={{
            0: {
              slidesPerView: 3,
              spaceBetween: 5,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 25,
            },
            880: {
              slidesPerView: 3,
            },
            1230: {
              slidesPerView: 4,
            },
          }}
          slides={
            products?.map((product, key) => (
              <Product key={key} {...product} />
            )) ?? []
          }
        />
      </div>
    </div>
  );
}
