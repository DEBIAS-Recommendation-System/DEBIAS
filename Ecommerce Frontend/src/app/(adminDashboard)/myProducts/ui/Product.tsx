"use client";
import TooltipGeneric from "@/app/ui/InsightGeneric";
import Image from "next/image";
import Link from "next/link";
import { FaPen } from "react-icons/fa";

type ProductProps = {
  title: string;
  price: number;
  discount: number;
  image_url: string | null;
  price_after_discount: number;
  slug: string | undefined | null;
  id: string | undefined | null;
};

export default function Product({
  title,
  price,
  price_after_discount,
  discount,
  image_url,
  slug,
  id,
}: Partial<ProductProps>) {
  console.log("price , discount , price_after_discount", price, discount, price_after_discount)
  // Use id for product page, slug for edit page
  return (
    <Link
      href={`/products/${id || slug}`}
      className=" relative flex h-[22rem] sm:h-[25rem] w-[13rem] sm:w-[15rem] flex-col items-center justify-center gap-4 overflow-hidden"
    >
      <div className="group h-full w-full overflow-hidden rounded-md border transition-all ease-linear hover:backdrop-brightness-75">
        {!!discount && (
          <Image
            src={"/home/icons/promo.png"}
            alt=""
            width={1000}
            height={1000}
            className="absolute -left-[9px] -top-[10px] h-[4rem] sm:h-[6rem] w-[4rem] sm:w-[6rem] rounded-tl-lg transition-all duration-200 ease-out group-hover:-left-[7px] group-hover:-top-[8px] group-hover:opacity-0"
          />
        )}
        <Image
          src={image_url ?? ""}
          alt=""
          width={2000}
          height={2000}
          className="h-full w-full cursor-pointer rounded-md object-cover sm:object-scale-down transition-all ease-linear group-hover:scale-[120%] group-hover:brightness-75"
        />
        <Link href={`/editProduct/${slug}`}>
          <button
            className="absolute bottom-[5%] left-[17.5%] z-0 flex h-[2.5rem] w-[10rem] flex-row items-center justify-center  rounded-xl-center gap-2 rounded-xl border border-slate-700 bg-white px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold capitalize text-slate-700 opacity-0 transition-all ease-linear hover:bg-slate-700 hover:text-white group-hover:opacity-100"
          >
            <span>Edit Article</span>
            <FaPen className="size-[1rem]" />
          </button>
        </Link>
      </div>

      <div className="w-full flex-col items-center justify-center gap-3 text-sm sm:text-lg">
        <TooltipGeneric tip={title ?? ""}>
          <span className="line-clamp-1 text-left">{title}</span>
        </TooltipGeneric>
        <div className="flex flex-row items-center justify-start gap-3">
          {!!discount && (
            <span className="text-color8">{price_after_discount} TND</span>
          )}
          {!!discount ? <del>{price} TND</del> : <span>{price} TND</span>}
        </div>
      </div>
    </Link>
  );
}
