import { DiscountTypeEnum, IProduct } from "@/types/database.tables.types";
import { Tables } from "@/types/database.types";

export function formatProduct(
  product: Tables<"products"> | null,
  {
    cart,
    wishlist,
  }: {
    cart: string[] | undefined;
    wishlist: string[] | undefined;
  },
): IProduct | null {
  
  if (!product) return null;
  return {
    ...product,
    available: product.stock > 0,
    isInCart: cart?.includes(product.id) ?? false,
    isInWishlist: wishlist?.includes(product.id) ?? false,
    price_after_discount:
      product.discount_type === DiscountTypeEnum.FIXED
        ? product.price - product.discount
        : product.price - (product.price * product.discount) / 100,
  };
}
