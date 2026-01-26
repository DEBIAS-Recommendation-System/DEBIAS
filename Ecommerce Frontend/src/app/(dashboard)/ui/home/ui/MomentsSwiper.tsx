"use client";
import { LiaBabyCarriageSolid } from "react-icons/lia";
import { PiBaby } from "react-icons/pi";
import { GiBalloons, GiClothes, GiSpiralLollipop } from "react-icons/gi";
import CustomSwiper from "@/app/ui/Swiper";
import useTranslation from "@/translation/useTranslation";
export default function MomentsSwiper() {
  const { data: translation } = useTranslation();
  const moments = [
    {
      title: translation?.lang["Wedding"],
      icon: <GiBalloons className="size-[6rem] font-thin text-red-900" />,
      bg: "bg-color1",
      text: "",
    },
    {
      title: translation?.lang["Celebrations & Birthdays"],
      icon: <PiBaby className="size-[6rem] font-thin text-cyan-900" />,
      bg: "bg-color2",
      text: "text-color2",
    },
    {
      title: translation?.lang["Graduation"],
      icon: (
        <LiaBabyCarriageSolid className="size-[6rem] font-thin text-sky-900" />
      ),
      bg: "bg-color3",
      text: "text-color3",
    },
    {
      title: translation?.lang["Anniversary"],
      icon: <GiClothes className="size-[6rem] font-thin text-rose-900" />,
      bg: "bg-color4",
      text: "text-color4",
    },
    {
      title: translation?.lang["Baby Shower"],
      icon: (
        <LiaBabyCarriageSolid className="size-[6rem] font-thin text-yellow-900" />
      ),
      bg: "bg-color5",
      text: "text-color5",
    },
    {
      title: translation?.lang["House Warming"],
      icon: (
        <GiSpiralLollipop className="size-[6rem] font-thin text-blue-900" />
      ),
      bg: "bg-color6",
      text: "text-color6",
    },
  ];
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white px-6 py-16" aria-labelledby="moments-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 
            id="moments-heading"
            dir={translation?.default_language ==="ar" ? "rtl" : "ltr"} 
            className="mb-3 text-4xl font-bold text-slate-900 max-[830px]:text-3xl max-[530px]:text-2xl"
          >
            {translation?.lang["Every moment is important. Choose your own!"]}
          </h2>
          <p className="text-lg text-slate-600">
            Discover products for every special occasion
          </p>
        </div>
        <CustomSwiper
          slidesPerView={4}
          spaceBetween={20}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 12,
            },
            600: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            1280: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
          }}
          loop
          autoplay
          slides={moments.map((e, i) => (
            <div
              key={i}
              className={`group relative h-full overflow-hidden rounded-xl border border-opacity-20 ${e.bg} p-8 transition-all duration-300 hover:shadow-xl max-[600px]:p-6`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-white/70 p-4 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                  {e.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{e.title}</h3>
              </div>
            </div>
          ))}
        />
      </div>
      
    </section>
  );
}
