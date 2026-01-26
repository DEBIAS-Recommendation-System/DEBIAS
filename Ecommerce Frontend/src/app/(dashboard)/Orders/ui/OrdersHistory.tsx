import OrderItem from "./OrderItem";
import { useOrderFilters } from "../context/FilterProvider";
import { OrderStatusEnum } from "@/types/database.tables.types";
import useUserOrders from "@/hooks/data/orders/useUserOrders";
import { Player } from "@lottiefiles/react-lottie-player";

export default function OrdersHistory() {
  const { sortBy, isReversed, filters } = useOrderFilters();
  const { data: orders } = useUserOrders();
  const statuses = ["pending", "approved", "cancelled", "fulfilled"] as const;
  const sortedOrders = orders?.sort((a, b) => {
    if (sortBy === "created_at") {
      return isReversed
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === "status") {
      return isReversed
        ? statuses.indexOf(b.status) - statuses.indexOf(a.status)
        : statuses.indexOf(a.status) - statuses.indexOf(b.status);
    } else if (sortBy === "total_price") {
      return isReversed
        ? b.total_price - a.total_price
        : a.total_price - b.total_price;
    }
    return 0;
  });
  const finalOrders = sortedOrders?.filter((order) => {
    if (
      filters[OrderStatusEnum.CANCELLED] &&
      order.status === OrderStatusEnum.CANCELLED
    )
      return order;
    if (
      filters[OrderStatusEnum.PENDING] &&
      order.status === OrderStatusEnum.PENDING
    )
      return order;
    if (
      filters[OrderStatusEnum.APPROVED] &&
      order.status === OrderStatusEnum.APPROVED
    )
      return order;
    if (
      filters[OrderStatusEnum.FULFILLED] &&
      order.status === OrderStatusEnum.FULFILLED
    )
      return order;
    return null;
  });
  return (
    <>
      {finalOrders && finalOrders.length > 0 ? (
        <div className="flex flex-col gap-10">
          {finalOrders?.map((item) => {
            return <OrderItem key={item.id} order={item} />;
          })}{" "}
        </div>
      ) : (
        <div className="mt-[5rem] flex h-screen w-full items-start justify-center rounded-md shadow-md">
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
    </>
  );
}
