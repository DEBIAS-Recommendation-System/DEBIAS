"use client";
import { useQuery } from "@tanstack/react-query";
import { cartQuery } from "./cartQuery";

export default function useCart() {
  const query = useQuery(cartQuery());
  
  // Debug logging
  console.log("🛒 [USE CART] Query state:", {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
  });
  
  const total_after_discount =
    query.data?.data?.reduce(
      (a, cartItem) =>
        a +
        ((cartItem.stock - cartItem.quantity )>= 0
          ? (cartItem.price-cartItem.discount) * cartItem.quantity
          : 0),
      0,
    ) ?? 0;

  const total_before_discount =
  query.data?.data?.reduce(
      (a, cartItem) =>
        a +
        ((cartItem.stock - cartItem.quantity )>= 0
          ? (cartItem?.price ?? 0) * cartItem.quantity
          : 0),
      0,
    ) ?? 0;

  const isFreeDelivery = total_after_discount >= 100;
  const delivery_cost_before_discount = 8;
  const delivery_cost = isFreeDelivery ? 0 : delivery_cost_before_discount;

  return {
    ...query,
    data: {
      ...query.data?.data,
      data: query.data?.data,
      cartId: query.data?.cartId,
      totalAmount: query.data?.totalAmount,
      total_before_discount,
      total_after_discount,
      total_with_delivery: total_after_discount + delivery_cost,
      total_products_quantity: query.data?.data?.reduce(
        (acc, cartItem) => acc + cartItem.quantity,
        0,
      ),
      isFreeDelivery,
      delivery_cost,
      delivery_cost_before_discount,
    },
  };
}
