"use client";
import useOrderById from "@/hooks/data/orders/useOrderById";
import OrderItem from "../../ui/OrderItem";
import OrderProducts from "./OrderProducts";
import useTranslation from "@/translation/useTranslation";

export default function Content({ id }: { id: string }) {
  const {data: translation} = useTranslation();
  const { data } = useOrderById(Number(id));
  const { order, orderProducts } = data?.data ?? {};
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-[55rem] max-md:w-[30rem] max-sm:w-[25rem]">
        <OrderItem key={order?.id} order={order ?? null} />
      </div>
      <h1 className="p-6 text-2xl font-semibold">
        {translation?.lang['Order Products']} ({orderProducts?.length}) :{" "}
      </h1>
      <OrderProducts products={orderProducts ?? []} />
    </div>
  );
}
