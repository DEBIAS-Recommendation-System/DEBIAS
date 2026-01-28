"use client";
import CustomSwiper from "@/app/ui/Swiper";
import useTranslation from "@/translation/useTranslation";
import { useCategories } from "@/hooks/fastapi/useCategories";
import Image from "next/image";

// Map category names to their SVG icons
const categoryIcons: Record<string, string> = {
  "Chef & Kitchen": "/categories/chef-hat.svg",
  "Fashion & Apparel": "/categories/dress.svg",
  "Gaming & Electronics": "/categories/game-controller.svg",
  "Home & Lighting": "/categories/lamp.svg",
  "Electronics & Power": "/categories/lightning.svg",
  "Sports & Footwear": "/categories/sneaker.svg",
  "Tech & Software": "/categories/windows-logo.svg",
};

// Map category names to background colors
const categoryColors: Record<string, string> = {
  "Chef & Kitchen": "bg-red-500",
  "Fashion & Apparel": "bg-pink-500",
  "Gaming & Electronics": "bg-purple-500",
  "Home & Lighting": "bg-yellow-500",
  "Electronics & Power": "bg-blue-500",
  "Sports & Footwear": "bg-green-500",
  "Tech & Software": "bg-indigo-500",
};

export default function MomentsSwiper() {
  const { data: translation } = useTranslation();
  
  console.log("=== MomentsSwiper component rendered ===");
  
  const { data: categoriesResponse, isLoading, error, isFetching, status } = useCategories();
  
  console.log("Categories response:", categoriesResponse);
  console.log("Is loading:", isLoading);
  console.log("Is fetching:", isFetching);
  console.log("Status:", status);
  console.log("Error:", error);
  
  // The response structure is { message: string, data: CategoryBase[] }
  const categories = categoriesResponse?.data || [];
  
  console.log("Categories array:", categories);
  console.log("Categories length:", categories.length);

  if (isLoading) {
    return (
      <section className="bg-gradient-to-b from-slate-50 to-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-3 text-4xl font-bold text-slate-900">Loading categories...</h2>
          </div>
        </div>
      </section>
    );
  }

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
              <div
                key={category.id}
                className={`group relative h-full overflow-hidden rounded-xl border border-opacity-20 ${bgColor} p-8 transition-all duration-300 hover:shadow-xl max-[600px]:p-6`}
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
              </div>
            );
          })}
        />
      </div>
      
    </section>
  );
}
