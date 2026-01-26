import React from "react";
import Content from "./ui/Content";
import OrderByIdHydration from "@/provider/OrderByIdHydration";

export default function page({ params }: { params: { order: string } }) {
  return (
    <OrderByIdHydration id={Number(params.order)}>
      <div className="min-h-screen w-full">
        <Content id={params.order} />
      </div>
    </OrderByIdHydration>
  );
}
