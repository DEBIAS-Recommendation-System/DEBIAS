"use client";

import React from "react";
import { Lato, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination as SwiperPagination, Navigation, Virtual, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
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

const playfair = Playfair_Display({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic';

export default function Page() {
  const [currentPage, setCurrentPage] = React.useState(1);

  return (
    <div className={lato.className + " flex min-h-screen flex-col overflow-x-hidden bg-white"}>
      {/* Navigation */}
      <nav className="animate-fade-in-down sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-20 w-full max-w-7xl flex-row items-center justify-between px-6 max-[830px]:px-4 max-[439px]:px-3">
          <Link href={"/"} className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 p-2 shadow-lg">
              <span className="text-xl font-bold text-white">SH</span>
            </div>
            <span className={`${playfair.className} text-2xl font-bold text-slate-900`}>ShopHub</span>
          </Link>
          
          <div className="hidden flex-row items-center justify-center gap-8 max-[830px]:hidden">
            <Link 
              href="/products" 
              className="relative font-medium text-slate-600 transition-colors hover:text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              Products
            </Link>
            <Link 
              href="/about" 
              className="relative font-medium text-slate-600 transition-colors hover:text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="relative font-medium text-slate-600 transition-colors hover:text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              Contact
            </Link>
          </div>
          
          <div className="flex flex-row items-center justify-end gap-4">
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm"
            >
              Login
            </Link>
            <Link 
              href="/cart" 
              className="relative rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 p-2.5 text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
              aria-label="Shopping cart"
            >
              <span className="text-xl">🛒</span>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                0
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="flex min-h-screen w-full flex-col">
          {/* Hero Banner Carousel */}
          <section className="animate-fade-in" aria-label="Featured banners">
            <Swiper
              className="w-full"
              modules={[Virtual, SwiperPagination, Navigation, Autoplay, EffectFade]}
              pagination={{ clickable: true, dynamicBullets: true }}
              initialSlide={0}
              slidesPerView={1}
              loop
              allowTouchMove
              speed={1200}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              autoplay={{
                delay: 6000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              onSwiper={(swiper) => {
                swiper.updateSize();
                swiper.update();
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <SwiperSlide key={"slide" + i} className="w-full">
                  <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 max-md:aspect-video">
                    <Image
                      src={`/home/banners/bannerPc${i + 1}.jpg`}
                      alt={`Featured promotion ${i + 1}`}
                      fill
                      priority={i === 0}
                      quality={85}
                      sizes="100vw"
                      className="object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          {/* Categories Section */}
          <section className="animate-fade-in-up bg-gradient-to-b from-slate-50 to-white px-6 py-16" aria-labelledby="categories-heading">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto mb-12 max-w-3xl text-center">
                <h2 
                  id="categories-heading"
                  className={`${playfair.className} mb-3 text-4xl font-bold text-slate-900 max-[830px]:text-3xl max-[530px]:text-2xl`}
                >
                  Shop by Category
                </h2>
                <p className="text-lg text-slate-600">
                  Discover our wide range of products across all categories
                </p>
              </div>

              <Swiper
                className="w-full"
                modules={[Virtual, Autoplay]}
                slidesPerView={4}
                spaceBetween={20}
                breakpoints={{
                  0: {
                    slidesPerView: 1,
                    spaceBetween: 12,
                  },
                  640: {
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
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                onSwiper={(swiper) => {
                  swiper.updateSize();
                  swiper.update();
                }}
              >
                {[
                  {
                    title: "Electronics",
                    icon: <GiBalloons className="size-12 text-blue-600" />,
                    gradient: "from-blue-100 to-blue-50",
                    borderColor: "border-blue-200",
                  },
                  {
                    title: "Fashion",
                    icon: <GiClothes className="size-12 text-pink-600" />,
                    gradient: "from-pink-100 to-pink-50",
                    borderColor: "border-pink-200",
                  },
                  {
                    title: "Home & Garden",
                    icon: <LiaBabyCarriageSolid className="size-12 text-green-600" />,
                    gradient: "from-green-100 to-green-50",
                    borderColor: "border-green-200",
                  },
                  {
                    title: "Sports & Outdoors",
                    icon: <GiSpiralLollipop className="size-12 text-orange-600" />,
                    gradient: "from-orange-100 to-orange-50",
                    borderColor: "border-orange-200",
                  },
                  {
                    title: "Books & Media",
                    icon: <PiBaby className="size-12 text-purple-600" />,
                    gradient: "from-purple-100 to-purple-50",
                    borderColor: "border-purple-200",
                  },
                  {
                    title: "Toys & Games",
                    icon: <GiBalloons className="size-12 text-red-600" />,
                    gradient: "from-red-100 to-red-50",
                    borderColor: "border-red-200",
                  },
                ].map((e, i) => (
                  <SwiperSlide key={"category" + i} className="h-auto">
                    <Link
                      href={`/products?category=${e.title}`}
                      className={`group relative block h-full overflow-hidden rounded-xl border ${e.borderColor} bg-gradient-to-br ${e.gradient} p-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
                      aria-label={`Shop ${e.title}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                        <div className="rounded-full bg-white/70 p-4 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                          {e.icon}
                        </div>
                        <h3 className="font-bold text-slate-800">{e.title}</h3>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>

          {/* Products Section */}
          <section className="animate-fade-in-up px-6 py-20" aria-labelledby="products-heading">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 text-center">
                <h2 
                  id="products-heading"
                  className={`${playfair.className} mb-3 text-4xl font-bold text-slate-900 max-[830px]:text-3xl max-[530px]:text-2xl`}
                >
                  Featured Products
                </h2>
                <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, key) => (
                  <article
                    key={key}
                    className="animate-scale-in group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    style={{ animationDelay: `${key * 0.1}s` }}
                  >
                    {/* Image Container */}
                    <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 md:h-72">
                      <Image
                        src={"/product/prod2.jpg"}
                        alt={`Product ${key + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                      {/* Promo Badge */}
                      <div 
                        className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 text-sm font-bold text-white shadow-lg"
                        aria-label="20% discount"
                      >
                        -20%
                      </div>
                      {/* Wishlist Button */}
                      <button 
                        className="absolute left-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition-all duration-300 hover:scale-110 hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        aria-label="Add to wishlist"
                      >
                        ❤️
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="font-semibold text-slate-900 line-clamp-2">
                        Premium Educational Product {key + 1}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1" role="img" aria-label="4 out of 5 stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < 4 ? "text-yellow-400" : "text-slate-300"}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-slate-500">(42 reviews)</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">
                          ${(Math.random() * 50 + 20).toFixed(2)}
                        </span>
                        <del className="text-sm text-slate-400">
                          ${(Math.random() * 100 + 50).toFixed(2)}
                        </del>
                      </div>

                      {/* Add to Cart Button */}
                      <button className="mt-auto rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95">
                        Add to Cart
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex justify-center">
                <Pagination
                  count={3}
                  page={currentPage}
                  onChange={(e, value) => setCurrentPage(value)}
                  boundaryCount={1}
                  color="primary"
                  size="large"
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="animate-fade-in-up bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-6 py-16">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 p-2 shadow-lg">
                  <span className="text-xl font-bold text-white">SH</span>
                </div>
                <span className={`${playfair.className} text-xl font-bold text-white`}>ShopHub</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Your ultimate destination for quality products across all categories. Experience seamless shopping with exceptional service.
              </p>
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-white">Categories</h3>
              <nav className="flex flex-col gap-2" aria-label="Product categories">
                {["Electronics", "Fashion", "Home & Garden", "Sports"].map((cat, i) => (
                  <Link
                    key={i}
                    href={`/products?category=${cat}`}
                    className="text-sm transition-colors hover:text-blue-400 hover:translate-x-1 inline-block"
                  >
                    {cat}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-white">Company</h3>
              <nav className="flex flex-col gap-2" aria-label="Company information">
                {["About Us", "Contact Us", "Privacy Policy", "Terms of Service"].map((link, i) => (
                  <button
                    key={i}
                    className="text-left text-sm transition-colors hover:text-blue-400 hover:translate-x-1 inline-block"
                  >
                    {link}
                  </button>
                ))}
              </nav>
            </div>

            {/* Newsletter */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-white">Newsletter</h3>
              <p className="text-sm text-slate-400">
                Subscribe to get updates on exclusive offers and new arrivals.
              </p>
              <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-white placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-slate-700" />

          {/* Social & Copyright */}
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex gap-4">
              <Link
                href="mailto:contact@shophub.com"
                className="rounded-full bg-slate-700 p-2 transition-all hover:bg-blue-600 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                aria-label="Email us"
              >
                <MdEmail className="size-5" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-700 p-2 transition-all hover:bg-pink-600 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                aria-label="Follow us on Instagram"
              >
                <FaInstagram className="size-5" />
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-700 p-2 transition-all hover:bg-blue-600 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                aria-label="Follow us on Facebook"
              >
                <FaFacebook className="size-5" />
              </Link>
            </div>
            <p className="text-center text-sm text-slate-400">
              &copy; {new Date().getFullYear()} ShopHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
