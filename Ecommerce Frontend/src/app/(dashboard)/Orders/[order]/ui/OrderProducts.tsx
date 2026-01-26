import { OrderProduct } from "@/hooks/data/orders/orderWithIdQuery";
import OrderItem from "./OrderItem";

export default function OrderProducts({
  products,
}: {
  products: OrderProduct[];
}) {
  if (!products) return null;
  console.log(products);
  return (
    <div className="flex flex-col gap-3 bg-gray-100 p-5">
      {products.map((item) => {
        return <OrderItem key={item.id} item={item} />;
      })}
    </div>
  );
}
