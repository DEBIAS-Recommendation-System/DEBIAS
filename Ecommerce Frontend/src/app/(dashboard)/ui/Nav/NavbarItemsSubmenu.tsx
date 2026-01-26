"use client";
import createNewPathname from "@/helpers/createNewPathname";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
export function NavbarItemsSubmenu(item: {
  title: string;
  href: string;
  subItems?: {
    title: string;
    filter: Record<string, string | number>;
    icon: React.ElementType;
  }[];
}) {
  const [isHovering, setIsHovering] = React.useState(false);
  const searchParams = useSearchParams();
  return (
    <div  className="relative h-full">
      <Link
        className={`${
          isHovering ? "bg-color1 text-white" : "text-slate-700"
        } flex h-full min-w-[5rem] items-center justify-center px-2 text-center text-lg font-normal text-slate-700 transition-all ease-linear hover:bg-color1 hover:text-white`}
        key={item.title}
        href={createNewPathname({
          currentPathname: item.href,
          currentSearchParams: searchParams,
          values: [],
        })}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {item.title}
      </Link>
      {isHovering && (
        <div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          id="account-menu"
          className={`${
            item.subItems && item.subItems.length > 6
              ? "grid grid-cols-2"
              : "flex flex-col"
          } absolute left-0 top-[100%] z-50 w-max min-w-full bg-white py-0 shadow-lg`}
        >
          {item.subItems?.map((subItem) => {
            const Icon = subItem.icon;
            return (
              <Link
                key={subItem.title}
                className="group flex cursor-pointer flex-row items-center gap-4 py-3 pl-3 pr-6 transition-all ease-linear hover:bg-color1 hover:text-white"
                href={createNewPathname({
                  currentPathname: item.href,
                  currentSearchParams: searchParams,
                  values: [
                    {
                      name: Object.keys(subItem.filter)[0],
                      value: String(
                        subItem.filter[Object.keys(subItem.filter)[0]],
                      ),
                    },
                  ],
                })}
              >
                <span>
                  {<Icon className="size-6 group-hover:text-white" />}
                </span>
                {subItem.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
