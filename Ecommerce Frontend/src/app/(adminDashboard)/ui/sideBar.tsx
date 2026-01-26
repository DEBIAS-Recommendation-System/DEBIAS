"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  FaBitbucket,
  FaGamepad,
  FaJediOrder,
  FaMailBulk,
  FaMoneyBillWave,
  FaPlusCircle,
} from "react-icons/fa";
import { usePathname } from "next/navigation";
import { PhoneSideBar } from "./phoneSideBar";
import { FaLetterboxd, FaSquareLetterboxd } from "react-icons/fa6";
import SignOutBtn from "@/app/(dashboard)/ui/Nav/SignOutBtn";
import { Logout } from "@mui/icons-material";

export default function SideBar() {
  const [isLoading, setIsLoading] = useState(false);
  const Pathname = usePathname();

  return (
    <>
      <div className="hidden w-[17rem] bg-slate-900 sm:flex sm:flex-col">
        <div className="p-3">
          <Link href={"/"}>
            <Image
              src="/logo/logo-2.png"
              alt="logo"
              width={120}
              height={120}
              className=""
            />
          </Link>
        </div>
        <div className="border-t-[1px] border-gray-500"></div>
        <ul className="py-6">
          <Link href={"/addProduct"}>
            <li
              className={`flex cursor-pointer items-center gap-2 px-4 py-3 ${
                Pathname.includes("addProduct")
                  ? "bg-customText hover:bg-hoverbutton text-white "
                  : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <FaPlusCircle className="text-xl" />
              <span className="text-lg">Create New Product</span>
            </li>
          </Link>
          <Link href={"/myProducts"}>
            <li
              className={`flex cursor-pointer items-center gap-2 px-4 py-3 ${
                Pathname.includes("myProducts")
                  ? "bg-customText hover:bg-hoverbutton text-white"
                  : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <FaGamepad className="text-2xl" />
              <span className="text-lg">My Products</span>
            </li>
          </Link>

          <Link href={"/earnings"}>
            <li
              className={`flex cursor-pointer items-center gap-2 px-4 py-3 ${
                Pathname.includes("earnings")
                  ? "bg-customText hover:bg-hoverbutton text-white "
                  : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <FaMoneyBillWave className="text-2xl" />
              <span className="text-lg">Earnings</span>
            </li>
          </Link>
          <Link href={"/stocks"}>
            <li
              className={`flex cursor-pointer items-center gap-2 px-4 py-3 ${
                Pathname.includes("stocks")
                  ? "bg-customText hover:bg-hoverbutton text-white "
                  : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <FaBitbucket className="text-xl" />
              <span className="text-lg">Stocks</span>
            </li>
          </Link>
          <Link href={"/orders"}>
            <li
              className={`flex cursor-pointer items-center gap-2 px-4 py-3 ${
                Pathname.includes("orders")
                  ? "bg-customText hover:bg-hoverbutton text-white "
                  : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <FaMailBulk className="text-xl" />
              <span className="text-lg">Orders</span>
            </li>
          </Link>
          <SignOutBtn>
            <li
              className={
                "bg-customText hover:bg-hoverbutton text-gray-500 flex cursor-pointer items-center gap-2 px-4 py-3 hover:text-gray-50"
              }
            >
              <Logout className="text-xl" />
              <span className="text-lg">Logout</span>
            </li>
          </SignOutBtn>
        </ul>
      </div>
      <PhoneSideBar />
    </>
  );
}
