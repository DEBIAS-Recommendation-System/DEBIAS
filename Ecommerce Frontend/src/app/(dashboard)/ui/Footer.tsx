"use client";
import Image from "next/image";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import Link from "next/link";
import { EMAIL, FB_LINK, IG_LINK } from "@/constants/Admin";
import useTranslation from "@/translation/useTranslation";
import { menuItems } from "@/constants/menuItems";

export default function Footer() {
  const { data: translation } = useTranslation();
  
  const SfariLinks = [
    translation?.lang["About Us"],
    translation?.lang["Contact Us"],
    translation?.lang["Privacy Policy"],
  ];

  return (
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
              {translation?.lang["Category"] || "Categories"}
            </div>
            <Link
              href="/products"
              className="line-clamp-1 cursor-pointer leading-6 transition-all ease-linear hover:font-medium hover:text-slate-500 hover:underline max-[470px]:text-sm"
            >
              {translation?.lang["Products"] || "All Products"}
            </Link>
            <Link
              href="/products"
              className="line-clamp-1 cursor-pointer leading-6 transition-all ease-linear hover:font-medium hover:text-slate-500 hover:underline max-[470px]:text-sm"
            >
              {translation?.lang["Deals"] || "Deals"}
            </Link>
          </div>
          <div className="max-[470px]:gap- flex flex-col items-center gap-2">
            <div className="mb-2 text-xl font-bold max-[470px]:text-[1rem]">
              Sfari
            </div>
            {SfariLinks.map((link, i) => (
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
            <div className="text-xl font-bold">
              {translation?.lang["Follow Us"]}
            </div>
            <div className="flex flex-row gap-2">
              <Link
                className="w-max cursor-pointer"
                target="window.location=another.html"
                href={`mailto:${EMAIL}`}
              >
                <MdEmail className="size-[1.5rem] cursor-pointer" />
              </Link>
              <Link
                className="w-max cursor-pointer"
                target="_blank"
                href={IG_LINK}
              >
                <FaInstagram className="size-[1.5rem] cursor-pointer" />
              </Link>
              <Link
                className="w-max cursor-pointer"
                target="_blank"
                href={FB_LINK}
              >
                <FaFacebook className="size-[1.5rem] cursor-pointer" />
              </Link>
            </div>
          </div>
          <div className="max-[1150px]:w-min max-[810px]:w-max max-[470px]:w-min flex w-max flex-col items-center justify-center gap-2">
            <span className="w-[70%] text-center">
              {
                translation?.lang[
                  "Sign up for our newsletter and always be the first to find out about all current offers and news!"
                ]
              }
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
                {translation?.lang["Sign up"]}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Attribution Section */}
      
    </footer>
  );
}
