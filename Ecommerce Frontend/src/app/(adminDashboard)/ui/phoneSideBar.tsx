"use client"
import SignOutBtn from "@/app/(dashboard)/ui/Nav/SignOutBtn";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logout } from "@mui/icons-material";
import { Menu, MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBitbucket, FaGamepad, FaMailBulk, FaMoneyBillWave, FaPlusCircle } from "react-icons/fa";

export function PhoneSideBar() {
  const Pathname= usePathname();
  return (
    <div className=" sm:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <div className="py-4 flex items-center">
            <Menu className="text-slate-900 cursor-pointer" />
          </div>
        </SheetTrigger>
        <SheetContent side={"left"} className="w-[12rem] bg-slate-900">
          <SheetHeader>
          </SheetHeader>
          <div className="">
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
          <ul className="py-4 text-xs">
            <Link href={"/addProduct"}>
            <li
              className={` flex gap-2 items-center py-3 cursor-pointer ${
                Pathname.includes("addProduct")
                  ? "bg-customText text-white hover:bg-hoverbutton "
                  : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <FaPlusCircle className="text-xl" />  
              <span className="">Create New Product</span>
            </li>
            </Link>
            <Link href={"/myProducts"}>
            <li
              className={` flex gap-2 items-center py-3 cursor-pointer ${
                Pathname.includes("myProducts")
                  ? "bg-customText text-white hover:bg-hoverbutton "
                  : "text-gray-500 hover:text-gray-50"
              }`}
            >
              <FaGamepad className="text-2xl" />
              <span className="">My Products</span>
            </li></Link>
          
            <Link href={"/earnings"}>
            <li
              className={` flex gap-2 items-center py-3 cursor-pointer ${
                Pathname.includes("earnings")
                ? "bg-customText text-white hover:bg-hoverbutton "
                  : "text-gray-500 hover:text-gray-50 "
              }`}
            >

              <FaMoneyBillWave className="text-2xl" />
              <span className="">Earnings</span>
            </li>
            </Link>
            <Link href={"/stocks"}>
            <li
              className={` flex gap-2 items-center py-3 cursor-pointer ${
                Pathname.includes("stocks")
                ? "bg-customText text-white hover:bg-hoverbutton "
                  : "text-gray-500 hover:text-gray-50"       }`} 
            >
              <FaBitbucket className="text-xl" />
              <span className="">Stocks</span>
            </li>
            </Link>
            <Link href={"/orders"}>
              <li
                className={`flex gap-2 items-center py-3 cursor-pointer ${
                  Pathname.includes("orders")
                  ? "bg-customText text-white hover:bg-hoverbutton "
                    : "text-gray-500 hover:text-gray-50"       }`} 
              >
                <FaMailBulk className="text-xl" />
                <span className="">Orders</span>
              </li>
            </Link>
            <SignOutBtn>
            <li
              className={
                "bg-customText hover:bg-hoverbutton text-gray-500 flex cursor-pointer items-center gap-2  py-3 hover:text-gray-50"
              }
            >
              <Logout className="text-xl" />
              <span className="">Logout</span>
            </li>
          </SignOutBtn>
          </ul>
          
          <SheetFooter>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
