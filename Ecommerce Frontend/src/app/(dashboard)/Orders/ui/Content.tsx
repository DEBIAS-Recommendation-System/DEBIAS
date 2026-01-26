"use client";
import OrdersHistory from "./OrdersHistory";
import { SortOrders } from "./SortOrders";
import { orderSortFilters } from "../constants/filters";
import { OrderFilterProvider } from "../context/FilterProvider";
import useTranslation from "@/translation/useTranslation";
import useUserOrders from "@/hooks/data/orders/useUserOrders";
import { useRouter } from "next/navigation";
import useUser from "@/hooks/data/user/useUser";

export default function Content() {
  const { data: translation } = useTranslation();
  const { data: orders, isLoading } = useUserOrders();
  const router = useRouter();
  const { data: user } = useUser();
  if (!user?.data) router.push("/login");
  if (isLoading || !orders) return null;
  return (
    <OrderFilterProvider>
      <div className="flex w-[60rem] flex-col justify-start gap-4 rounded-md bg-white p-6 transition-all duration-300">
        <h1 className="pt-10 text-2xl font-semibold">
          {translation?.lang["Orders history"]} ({orders?.length}):{" "}
        </h1>
        <SortOrders filters={orderSortFilters} />
        <OrdersHistory />
      </div>
    </OrderFilterProvider>
  );
}
