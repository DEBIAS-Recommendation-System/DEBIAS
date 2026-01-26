import type { Metadata } from "next";
import { Lato } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Pagination } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination as SwiperPagination, Navigation, Virtual, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { LiaBabyCarriageSolid } from "react-icons/lia";
import { PiBaby } from "react-icons/pi";
import { GiBalloons, GiClothes, GiSpiralLollipop } from "react-icons/gi";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const lato = Lato({
  weight: ["100", "300", "400", "700", "900"],
  subsets: ["latin"],
  style: ["normal"],
});

export const metadata: Metadata = {
  title: "Sfari Jouets | Jeux Éducatifs تونس - ألعاب تعليمية للأطفال",
  description:
    "اكتشفوا مجموعة واسعة من الألعاب التعليمية في تونس مع Sfari Jouets. Jouets éducatifs pour enfants en Tunisie, qualité, apprentissage et développement garanti.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: [
    "jeux éducatifs Tunisie",
    "jouets éducatifs Tunisie",
    "jouets enfants Tunisie",
    "magasin jouets Tunisie",
    "Montessori Tunisie",
    "ألعاب تعليمية تونس",
    "ألعاب أطفال تونس",
    "ألعاب تعليمية للأطفال",
    "متجر ألعاب تعليمية تونس",
  ],
  authors: [
    {
      name: "Sfari Jouets",
      url: "https://sfari-jouets.com",
    },
  ],
  openGraph: {
    title: "Sfari Jouets | Jeux Éducatifs تونس - ألعاب تعليمية للأطفال",
    description:
      "Sfari Jouets يقدم ألعاب تعليمية للأطفال في تونس بجودة عالية وأسعار مناسبة. Jouets éducatifs pour enfants en Tunisie.",
    url: "https://sfari-jouets.com",
    siteName: "Sfari Jouets",
    images: [
      {
        url: "https://sfari-jouets.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sfari Jouets - Jeux éducatifs et ألعاب تعليمية في تونس",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  alternates: {
    canonical: "https://sfari-jouets.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* GA4 Script Loader */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-QKZC2GB76E`}
        />

        {/* GA4 Config */}
        <Script id="ga4-init">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QKZC2GB76E');
          `}
        </Script>
      </head>

      <body className={lato.className + " min-h-screen"}>
        {/* Dashboard Layout Content */}
        <div className="flex h-full min-h-screen flex-col overflow-x-hidden">
          {/* Navigation */}
          <nav className="mx-auto flex h-20 w-full flex-row items-center justify-evenly px-4 max-[830px]:justify-between max-[439px]:px-2 min-[830px]:max-w-[80rem]">
            <Link href={"/"}>
              <Image
                src="/logo/logo-2.png"
                alt="logo"
                width={110}
                height={110}
                className="py-3 max-[830px]:hidden"
              />
            </Link>
            <div className="flex h-full flex-row items-center justify-center gap-6 max-[830px]:hidden">
              {/* Menu items would go here */}
              <div className="flex flex-row items-center justify-center gap-4">
                <Link href="/products" className="font-semibold text-slate-700 hover:text-slate-900">
                  Toys
                </Link>
                <Link href="/about" className="font-semibold text-slate-700 hover:text-slate-900">
                  About
                </Link>
                <Link href="/contact" className="font-semibold text-slate-700 hover:text-slate-900">
                  Contact
                </Link>
              </div>
            </div>
            <div className="flex flex-row items-center justify-evenly gap-12 max-[530px]:gap-2">
              <div className="flex flex-row items-center relative">
                <Link
                  href="/login"
                  className="flex h-9 items-center justify-center rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-center font-semibold text-slate-700 transition-all ease-linear hover:bg-slate-700 hover:text-white"
                >
                  Login
                </Link>
                <Link href="/Cart">
                  <button className="ml-2 flex h-9 items-center justify-center rounded-lg border border-slate-700 bg-transparent px-3 py-2">
                    🛒
                  </button>
                </Link>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="h-full min-h-screen w-full">
            <div className="flex min-h-screen w-screen flex-col overflow-x-hidden">
              <hr />
              
              {/* HomeSwiper Component Inlined */}
              <div className="[&_.swiper-pagination-bullet-active]:bg-color1">
                <div className="hidden max-[600px]:hidden md:block">
                  <Swiper
                    className="w-full"
                    modules={[Virtual, SwiperPagination, Navigation, Autoplay]}
                    slidesPerGroupSkip={3}
                    pagination={{ clickable: true }}
                    initialSlide={0}
                    slidesPerView={1}
                    loop
                    allowTouchMove
                    speed={1500}
                    autoplay={{
                      delay: 5000,
                      disableOnInteraction: true,
                    }}
                    onSwiper={(swiper) => {
                      swiper.updateSize();
                      swiper.update();
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SwiperSlide key={"slide" + i} className="h-min w-min">
                        <Image
                          key={i}
                          src={`/home/banners/bannerPc${i + 1}.jpg`}
                          alt=""
                          width={1920}
                          height={1000}
                          quality={100}
                          className="h-[50vh] w-full"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <div className="block max-[600px]:block md:hidden">
                  <Swiper
                    className="w-full"
                    modules={[Virtual, SwiperPagination, Navigation, Autoplay]}
                    slidesPerGroupSkip={3}
                    pagination={{ clickable: true }}
                    initialSlide={0}
                    slidesPerView={1}
                    loop
                    allowTouchMove
                    speed={1500}
                    autoplay={{
                      delay: 5000,
                      disableOnInteraction: true,
                    }}
                    onSwiper={(swiper) => {
                      swiper.updateSize();
                      swiper.update();
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SwiperSlide key={"slide" + i} className="h-min w-min">
                        <Image
                          key={i}
                          src={`/home/banners/bannerPhone${i + 1}.jpg`}
                          alt=""
                          width={1920}
                          height={1000}
                          className="h-[50vh] w-full"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>

              {/* MomentsSwiper Component Inlined */}
              <div className="flex w-full flex-col gap-6 bg-gray-100 px-4 pb-10 pt-6 text-center">
                <span className="text-[2rem] font-semibold text-slate-800 max-[830px]:text-[1.5rem] max-[530px]:text-[1rem]">
                  Every moment is important. Choose your own!
                </span>
                <div className="mx-auto max-w-[75vw] max-[500px]:max-w-[90vw]">
                  <Swiper
                    className="w-full"
                    modules={[Virtual, SwiperPagination, Navigation, Autoplay]}
                    slidesPerGroupSkip={3}
                    slidesPerView={4}
                    spaceBetween={25}
                    breakpoints={{
                      0: {
                        slidesPerView: 1,
                        spaceBetween: 10,
                      },
                      600: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                      },
                      1200: {
                        slidesPerView: 4,
                      },
                    }}
                    loop
                    autoplay
                    onSwiper={(swiper) => {
                      swiper.updateSize();
                      swiper.update();
                    }}
                  >
                    {[
                      {
                        title: "Wedding",
                        icon: <GiBalloons className="size-[6rem] font-thin text-red-900" />,
                        bg: "bg-color1",
                      },
                      {
                        title: "Celebrations & Birthdays",
                        icon: <PiBaby className="size-[6rem] font-thin text-cyan-900" />,
                        bg: "bg-color2",
                      },
                      {
                        title: "Graduation",
                        icon: <LiaBabyCarriageSolid className="size-[6rem] font-thin text-sky-900" />,
                        bg: "bg-color3",
                      },
                      {
                        title: "Anniversary",
                        icon: <GiClothes className="size-[6rem] font-thin text-rose-900" />,
                        bg: "bg-color4",
                      },
                      {
                        title: "Baby Shower",
                        icon: <LiaBabyCarriageSolid className="size-[6rem] font-thin text-yellow-900" />,
                        bg: "bg-color5",
                      },
                      {
                        title: "House Warming",
                        icon: <GiSpiralLollipop className="size-[6rem] font-thin text-blue-900" />,
                        bg: "bg-color6",
                      },
                    ].map((e, i) => (
                      <SwiperSlide key={"slide" + i} className="h-min w-min">
                        <div
                          className={`flex h-[8rem] flex-row items-center justify-center gap-4 rounded-lg max-[600px]:h-[6rem] ${e.bg} p-6`}
                        >
                          <span className="text-lg font-bold text-white">{e.title}</span>
                          {e.icon}
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>

              {/* ProductsSection Component Inlined */}
              <div className="my-20 flex min-h-screen flex-col gap-12">
                <div className="flex flex-row items-center justify-center gap-3">
                  <Image
                    src="/home/icons/flower_yellow.png"
                    alt=""
                    height={15}
                    width={15}
                  />
                  <div className="text-2xl font-bold uppercase text-color5">
                    our products
                  </div>
                  <Image
                    src="/home/icons/flower_yellow.png"
                    alt=""
                    height={15}
                    width={15}
                  />
                </div>
                
                {/* Products Grid */}
                <div className="mx-auto grid min-h-screen w-fit grid-cols-4 gap-x-10 gap-y-10 max-[1150px]:grid-cols-3 max-[830px]:grid-cols-2">
                  {/* Product Item (repeated for demonstration) */}
                  {Array.from({ length: 8 }).map((_, key) => (
                    <div key={key} className="relative flex h-[25rem] w-[15rem] flex-col items-center justify-center gap-4 overflow-hidden max-[640px]:h-[17.5rem] max-[640px]:w-[10rem]">
                      <div className="group h-full w-full overflow-hidden rounded-md border transition-all ease-linear hover:backdrop-brightness-75">
                        <Image
                          src={"/home/icons/promo.png"}
                          alt=""
                          width={1000}
                          height={1000}
                          className=".preserve-3d absolute -left-[9px] -top-[10px] h-[6rem] w-[6rem] rounded-tl-lg border-t transition-all duration-200 ease-out group-hover:-left-[7px] group-hover:-top-[8px] group-hover:opacity-0"
                        />
                        <Link href={`/products/product-${key}`}>
                          <Image
                            src={"/product/prod2.jpg"}
                            alt=""
                            width={2000}
                            height={2000}
                            className=".preserve-3d h-full w-full cursor-pointer rounded-md object-scale-down transition-all ease-linear group-hover:scale-[120%] group-hover:brightness-75"
                          />
                        </Link>
                        <button className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800">
                          Add to Cart
                        </button>
                      </div>
                      <div className="fle z-20 w-full flex-col items-center justify-center gap-6 text-lg">
                        <button className="absolute right-2 top-2 text-2xl">
                          ❤️
                        </button>
                        <span className="z-0 mr-9 line-clamp-1 text-left">
                          Educational Toy {key + 1}
                        </span>
                        <div className="flex flex-row items-center justify-start gap-4 max-[540px]:text-sm">
                          <span className="text-color8">
                            {(Math.random() * 50 + 20).toFixed(2)} TND
                          </span>
                          <del>{(Math.random() * 100 + 50).toFixed(2)} TND</del>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  className="flex w-full justify-center"
                  count={3}
                  page={1}
                  boundaryCount={1}
                />
              </div>
            </div>
          </main>

          {/* Footer Component Inlined */}
          <footer className="mt-[5rem] bg-gray-100">
            {/* Main Footer Content */}
            <div className="flex flex-row items-start justify-center gap-12 px-[2rem] pb-8 pt-10 max-[870px]:gap-6 max-[810px]:flex-col max-[810px]:items-center max-[810px]:gap-10">
              <div className="flex flex-row items-start justify-center gap-12 max-[470px]:gap-6 max-[400px]:gap-4">
                <Image
                  src="/logo/logo-2.png"
                  alt="logo"
                  width={150}
                  height={150}
                  className="py-3"
                />
                <div className="flex flex-col items-center gap-2 max-[470px]:gap-1">
                  <div className="mb-2 text-xl font-bold max-[470px]:text-[1rem]">
                    Categories
                  </div>
                  {["Educational Toys", "Outdoor Toys", "Board Games", "Creative Toys"].map((category, i) => (
                    <Link
                      href={`/products?category=${category}`}
                      className="line-clamp-1 cursor-pointer leading-6 transition-all ease-linear hover:font-medium hover:text-slate-500 hover:underline max-[470px]:text-sm"
                      key={i}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
                <div className="max-[470px]:gap- flex flex-col items-center gap-2">
                  <div className="mb-2 text-xl font-bold max-[470px]:text-[1rem]">
                    Sfari
                  </div>
                  {["About Us", "Contact Us", "Privacy Policy"].map((link, i) => (
                    <div
                      className="line-clamp-1 cursor-pointer leading-6 transition-all ease-linear hover:font-medium hover:text-slate-500 hover:underline max-[470px]:text-sm"
                      key={i}
                    >
                      {link}
                    </div>
                  ))}
                </div>
              </div>
              <div className="min-[1150]:-mr-[5rem] flex w-fit flex-col items-center justify-center gap-4 max-[870px]:gap-2">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="text-xl font-bold">Follow Us</div>
                  <div className="flex flex-row gap-2">
                    <Link
                      className="w-max cursor-pointer"
                      target="window.location=another.html"
                      href={`mailto:contact@sfari-jouets.com`}
                    >
                      <MdEmail className="size-[1.5rem] cursor-pointer" />
                    </Link>
                    <Link
                      className="w-max cursor-pointer"
                      target="_blank"
                      href="https://instagram.com"
                    >
                      <FaInstagram className="size-[1.5rem] cursor-pointer" />
                    </Link>
                    <Link
                      className="w-max cursor-pointer"
                      target="_blank"
                      href="https://facebook.com"
                    >
                      <FaFacebook className="size-[1.5rem] cursor-pointer" />
                    </Link>
                  </div>
                </div>
                <div className="max-[1150px]:w-min max-[810px]:w-max max-[470px]:w-min flex w-max flex-col items-center justify-center gap-2">
                  <span className="w-[70%] text-center">
                    Sign up for our newsletter and always be the first to find out about all current offers and news!
                  </span>
                  <form className="flex flex-row items-center justify-center">
                    <input
                      className="h-[2.5rem] rounded-l-sm border border-slate-500 border-r-transparent px-3 py-2 text-sm font-semibold capitalize text-slate-700 placeholder:text-gray-300 focus:outline-none"
                      type="email"
                      placeholder="Enter your email Address"
                    />
                    <button
                      className={`flex h-[2.5rem] w-[10rem] items-center justify-center rounded-r-sm border border-slate-700 bg-white px-3 py-2 text-center text-sm font-semibold capitalize text-slate-700 transition-all ease-linear hover:bg-slate-700 hover:text-white`}
                    >
                      Sign up
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            {/* Attribution Section */}
            <div className="border-t border-gray-200 bg-gray-50 px-[2rem] py-4">
              <div className="flex items-center justify-center">
                <div className="group flex items-center gap-2 text-sm text-gray-600 transition-all duration-300 hover:text-gray-800">
                  <span>crafted with</span>
                  <div className="relative">
                    <div className="h-4 w-4 animate-pulse text-red-500 transition-all duration-300 group-hover:scale-110">
                      ❤️
                    </div>
                  </div>
                  <span>by</span>
                  <Link
                    href="https://evowave.dev"
                    target="_blank"
                    className="relative font-semibold text-slate-700 transition-all duration-300 hover:text-slate-900"
                  >
                    <span className="relative z-10">Evowave</span>
                    <div className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
