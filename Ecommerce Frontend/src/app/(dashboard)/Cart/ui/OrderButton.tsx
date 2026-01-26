"use client";
import useCart from "@/hooks/data/cart/useCart";
import useTranslation from "@/translation/useTranslation";
import Link from "next/link";

export default function OrderButton() {
  const { data: translation } = useTranslation();
  const { data: cart } = useCart();
  if (cart.data?.length === 0) {
    return (
      <Link
        href="/products"
        className="w-full cursor-not-allowed rounded-lg bg-color1 p-3 text-center text-xl font-semibold text-white transition-all duration-300 hover:bg-gray-800"
      >
        {translation?.lang["Order Some Products first"]}
      </Link>
    );
  }
  if (cart.total_products_quantity === 0) {
    return (
      <div className="w-full rounded-lg bg-gray-600 p-3 text-center text-xl font-semibold text-white transition-all duration-300 hover:bg-gray-800">
        {translation?.lang["Select a quantity"]}
      </div>
    );
  }

  return (
    <Link
      href="/Cart/Payment"
      className="w-full rounded-lg bg-color1 p-3 text-center text-xl font-semibold text-white transition-all duration-300 hover:bg-red-400"
    >
      {translation?.lang["Order {PRICE} TND"].replace(
        "{PRICE}",
        cart.total_after_discount.toFixed(2),
      )}
    </Link>
  );
}
