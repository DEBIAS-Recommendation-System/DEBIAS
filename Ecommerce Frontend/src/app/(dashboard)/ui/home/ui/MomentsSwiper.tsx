"use client";
import CustomSwiper from "@/app/ui/Swiper";
import useTranslation from "@/translation/useTranslation";
import Image from "next/image";
import Link from "next/link";

// Local categories data
const categories = [
  { id: 1, name: "Accessories" },
  { id: 2, name: "Apparel" },
  { id: 3, name: "Appliances" },
  { id: 4, name: "Computers" },
  { id: 5, name: "Construction" },
  { id: 6, name: "Electronics" },
  { id: 7, name: "Furniture" },
  { id: 8, name: "Kids" },
  { id: 9, name: "Sport" },
];

// Map category names to their SVG icons
const categoryIcons: Record<string, string> = {
  "Accessories": "/categories/handbag.svg",
  "Apparel": "/categories/Apparel .svg",
  "Appliances": "/categories/Appliances.svg",
  "Computers": "/categories/Computers.svg",
  "Construction": "/categories/construction.svg",
  "Electronics": "/categories/electronics.svg",
  "Furniture": "/categories/furniture.svg",
  "Kids": "/categories/kids.svg",
  "Sport": "/categories/sports.svg",
};

// Map category names to background colors
const categoryColors: Record<string, string> = {
  "Accessories": "bg-purple-500",
  "Apparel": "bg-pink-500",
  "Appliances": "bg-yellow-500",
  "Computers": "bg-blue-500",
  "Construction": "bg-orange-500",
  "Electronics": "bg-indigo-500",
  "Furniture": "bg-amber-600",
  "Kids": "bg-rose-400",
  "Sport": "bg-green-500",
};

export default function MomentsSwiper() {
  const { data: translation } = useTranslation();

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white px-6 py-16" aria-labelledby="moments-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 
            id="moments-heading"
            dir={translation?.default_language ==="ar" ? "rtl" : "ltr"} 
            className="mb-3 text-4xl font-bold text-slate-900 max-[830px]:text-3xl max-[530px]:text-2xl"
          >
            {translation?.lang["Categories"] || "Explore Our Categories"}
          </h2>
          <p className="text-lg text-slate-600">
            Discover products across all categories
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
          slides={categories.map((category, i) => {
            const iconPath = categoryIcons[category.name] || "/categories/chef-hat.svg";
            const bgColor = categoryColors[category.name] || "bg-slate-500";
            
            return (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className={`group relative h-full overflow-hidden rounded-xl border border-opacity-20 ${bgColor} p-8 transition-all duration-300 hover:shadow-xl max-[600px]:p-6 block cursor-pointer`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="rounded-full bg-white/90 p-6 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                    <Image
                      src={iconPath}
                      alt={category.name}
                      width={64}
                      height={64}
                      className="h-16 w-16"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white">{category.name}</h3>
                </div>
              </Link>
            );
          })}
        />
      </div>
      
    </section>
  );
}
