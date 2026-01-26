"use client";
import useTranslation from "@/translation/useTranslation";
import { Offer, OfferProps } from "./Offer";

export function OffersContainer() {
  const { data: translation } = useTranslation();
  const offers: OfferProps[] = [
    {
      name: translation?.lang["OFFER1"],
      image_url: "/home/offers/offer-1.jpg",
      variant: "slate",
      description: translation?.lang["OFFER1 DESCRIPTION"],
    },
    {
      name: translation?.lang["OFFER2"],
      image_url: "/home/offers/offer-2.jpg",
      variant: "white",
      description: translation?.lang["OFFER2 DESCRIPTION"],
    },
  ];
  return (
    <div className="flex flex-row items-center justify-center gap-10 max-[1000px]:flex-col max-[1000px]:gap-2">
      {offers.map((e, i) => (
        <Offer key={i} {...e} />
      ))}
    </div>
  );
}
