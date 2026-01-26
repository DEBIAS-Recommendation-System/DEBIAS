"use client";
import { IoMenu } from "react-icons/io5";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import useTranslation from "@/translation/useTranslation";
import { menuItems } from "@/constants/menuItems";
export default function PhoneSheet() {
  const { data: translation } = useTranslation();
  return (
    <Sheet>
      <SheetTrigger>
        <IoMenu className="hidden size-[2.5rem] cursor-pointer text-3xl max-[830px]:block" />
      </SheetTrigger>
      <SheetContent
        className="xs:w-[15rem] z-[100] w-[75%] p-0 sm:w-[18rem]"
        side={"left"}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center justify-start p-6">
            <SheetClose asChild>
              <Link href={"/"}>
                <Image
                  src="/logo/logo-2.png"
                  alt="logo"
                  width={150}
                  height={150}
                  className="py-3"
                />
              </Link>
            </SheetClose>
          </SheetTitle>
          <SheetDescription className="flex h-full flex-col items-start justify-start">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <SheetClose className="w-full" key={item.title}>
                  <Link
                    key={item.title}
                    href={item.href}
                    className="xs:text-lg flex w-full min-w-max border-collapse cursor-pointer flex-row items-center gap-2 px-3 py-6 text-left text-base font-bold text-black hover:bg-color1 hover:font-semibold hover:text-white sm:text-xl"
                  >
                    <Icon className="size-8" />
                    <span>{translation?.lang[item.title]}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
