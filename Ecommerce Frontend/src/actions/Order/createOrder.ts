"use server";
import postData from "@/api/postData";
import getTranslation from "@/translation/getTranslation";
import { Tables } from "@/types/database.types";
import { OrderStatusEnum } from "@/types/database.tables.types";
import { formatProduct } from "@/hooks/data/products/formatProducts";
import { ICartItem } from "@/hooks/data/cart/cartQuery";
import getSession from "@/api/getSession";
import { sendMail } from "@/api/sendEmail";
import { EMAIL } from "@/constants/Admin";

export default async function createOrder({
  order,
  cart,
}: {
  order: Omit<
    Tables<"orders">,
    | "cancel_reason"
    | "created_at"
    | "id"
    | "status"
    | "total_price"
    | "user_id"
    | "wholesale_price"
  >;
  cart: ICartItem[] | undefined;
}) {
  const translation = await getTranslation("fr");
  try {
    if (!cart || cart.length === 0) {
      throw new Error(translation.lang["Cart is empty"]);
    }

    const session = await getSession();
    const user_id = session.session?.user.id;

    const productIds = cart.map((item) => item.id);

    const total_price = cart
      .map((cartItem) => ({
        ...cartItem,
        product: formatProduct(cartItem, {
          wishlist: [],
          cart: productIds,
        }),
      }))
      .reduce((acc, cartItem) => {
        if (!cartItem.product) {
          throw new Error(translation.lang["Product not found"]);
        }

        if (cartItem.product.stock < cartItem.quantity) {
          throw new Error(
            translation.lang["Not enough stock for {PRODUCT_NAME}"].replace(
              "{PRODUCT_NAME}",
              cartItem.product.title,
            ),
          );
        }

        return acc + cartItem.quantity * cartItem.product.price_after_discount;
      }, 0);

    const wholesale_price = cart.reduce(
      (acc, item) => acc + item.quantity * item.wholesale_price,
      0,
    );

    const { data: newOrder, error: ordersError } = await postData<"orders">({
      tableName: "orders",
      payload: [
        {
          ...order,
          wholesale_price,
          status: OrderStatusEnum.PENDING,
          total_price,
          user_id,
        },
      ],
    });

    if (ordersError || !newOrder || newOrder.length === 0) {
      throw new Error(translation.lang["Failed to submit order"]);
    }

    // Insert order products
    const { error: orderProductsError } = await postData<"order_products">({
      tableName: "order_products",
      payload: cart.map((item) => ({
        discount_type: item.discount_type,
        discount: item.discount,
        price_before_discount: item.price,
        wholesale_price: item.wholesale_price,
        order_id: newOrder[0].id,
        product_id: item.id,
        quantity: item.quantity,
      })),
    });

    if (orderProductsError) {
      throw new Error(translation.lang["Something went wrong while ordering"]);
    }

    await sendMail({
      to: session.session?.user.email ?? "",
      subject: "Order confirmation",
      text: "Your order has been confirmed",
      html: "<h1>Your order has been confirmed</h1>",
    });

    await sendMail({
      to: EMAIL,
      subject: "New order",
      text: "You have a new order",
      html: "<h1>You have a new order</h1>",
    });

    return { user_id, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, user_id: null };
    } else {
      return {
        error: translation.lang["An unexpected error occurred"],
        user_id: null,
      };
    }
  }
}
