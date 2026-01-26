"use client";
import useTranslation from "@/translation/useTranslation";
import Image from "next/image";
import Link from "next/link";

export type OfferProps = {
  image_url: string;
  name: string | undefined;
  description: string | undefined;
  variant: "white" | "slate";
};
export function Offer({ name, description, image_url, variant }: OfferProps) {
  const { data: translation } = useTranslation();
  return (
    <div className="group mt-10 flex cursor-pointer flex-row items-center overflow-hidden">
      <div className="relative h-[20rem] w-[35rem] max-[1300px]:h-[15rem] max-[1300px]:w-full">
        <div
          className={`absolute top-5 z-50 flex flex-col items-start justify-center gap-3 px-5 ${
            variant === "white" ? "text-white" : "text-slate-600"
          }`}
        >
          <span className="text-3xl font-semibold">{name}</span>
          <span className="font-normal min-[440px]:max-w-[50%] min-[1300px]:mb-6">
            {description}
          </span>
          <Link
            href="#"
            className={`rounded-lg border bg-transparent px-3 py-2 text-center font-semibold transition-all ease-linear ${
              variant === "white"
                ? "border-white text-white hover:bg-white hover:text-slate-700"
                : "border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {translation?.lang["More Details"]}
          </Link>
        </div>
        <Image
          className="h-full w-full rounded-md object-fill transition-all ease-linear group-hover:scale-[115%]"
          src={image_url}
          alt=""
          width={2000}
          height={2000}
        />
      </div>
    </div>
  );
}
