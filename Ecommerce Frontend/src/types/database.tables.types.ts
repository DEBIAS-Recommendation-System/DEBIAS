import { UseQueryOptions } from "@tanstack/react-query";
import { Database, Tables } from "./database.types";

// Tables names
export type dbTableType = keyof Database[Extract<
  keyof Database,
  "public"
>]["Tables"];

export type Cart = { product: IProduct; quantity: number }[];

export interface IProduct extends Tables<"products"> {
  available: boolean;
  price_after_discount: number;
  isInCart: boolean;
  isInWishlist: boolean;
}

export type QueryReturnType<T extends () => UseQueryOptions> = Awaited<
  ReturnType<
    ReturnType<T>["queryFn"] extends (...args: any) => any
      ? ReturnType<T>["queryFn"]
      : never
  >
>;

export enum DiscountTypeEnum {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
}

export enum PaymentMethodEnum {
  CASH = "cash",
  ONLINE = "online",
}

export enum OrderStatusEnum {
  PENDING = "pending",
  CANCELLED = "cancelled",
  FULFILLED = "fulfilled",
  APPROVED = "approved",
}

export type ILanguages = "en" | "fr" | "ar";
