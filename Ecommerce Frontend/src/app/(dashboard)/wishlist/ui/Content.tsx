"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Pagination } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { productsQuery } from "@/hooks/data/products/productsQuery";
import useTranslation from "@/translation/useTranslation";
import usePopulatedWishlist from "@/hooks/data/wishlist/usePopulatedWishlist";
import { Player } from "@lottiefiles/react-lottie-player";
import useUser from "@/hooks/data/user/useUser";
import { useRouter } from "next/navigation";
import Product from "../../ui/home/ui/ProductsSection/Product";

function Content() {
  const [page, setPage] = useState(1);
  const limit = 8;
  const { data: wishlist } = usePopulatedWishlist({ page, limit });
  const queryClient = useQueryClient();
  useEffect(() => {
    if (wishlist?.meta?.has_next_page) {
      queryClient.prefetchQuery(
        productsQuery({
          page: page + 1,
          limit,
        }),
      );
    }
  }, [page, wishlist?.meta?.has_next_page, queryClient]);
  const { data: translation } = useTranslation();
  const { data: user } = useUser();
  const router = useRouter();
  if (!user?.data) router.push("/login");
  return (
    <div
      className="flex flex-col gap-20"
      dir={translation?.default_language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-2xl font-bold uppercase text-color5">
          {translation?.lang["Wishlist"]}
        </div>
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
      </div>

      {wishlist?.data && wishlist?.data.length > 0 ? (
        <div className="mx-auto grid w-fit grid-cols-4 gap-x-10 gap-y-4 max-[1150px]:grid-cols-3 max-[830px]:grid-cols-2">
          {wishlist.data.map((product, key) => (
            <Product key={key} {...product.products} />
          ))}
        </div>
      ) : (
        <div className="mt-[7rem] flex h-screen w-screen items-start justify-center rounded-md shadow-md">
          <Player
            src={
              "https://lottie.host/fb8aeca5-0f35-4b8c-bd0e-853461ff27a0/gcsVrueMx1.json"
            }
            className="h-60 w-60"
            loop
            autoplay
          />
        </div>
      )}
      <Pagination
        dir="ltr"
        className="flex w-full justify-center"
        count={wishlist.meta?.total_pages}
        page={page}
        boundaryCount={1}
        onChange={(e, value) => setPage(value)}
      />
    </div>
  );
}

export default Content;
