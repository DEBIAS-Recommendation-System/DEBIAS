"use client";
import React, { useState } from "react";
import useProducts from "@/hooks/data/products/useProducts";
import Image from "next/image";
import { Enums, Tables } from "@/types/database.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import postData from "@/api/postData";
import updateData from "@/api/updateData"; // The function for updating stock
import { useToast } from "@/hooks/useToast";
import { useOrder } from "../../context/useOrder";
import { useStep } from "../../context/useStep";
import EditOrderStatus from "./orderStatus";
import SelectedProducts from "./selectedProducts";

type SelectedProduct = Tables<"products"> & {
  quantity: number;
};

export default function OrderContent() {
  const { order, setOrder } = useOrder();
  const { setStep } = useStep();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] =
    useState<Enums<"status_type_enum">>("pending");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [insufficientStockProducts, setInsufficientStockProducts] = useState<
    string[]
  >([]);

  const AddOrderMutation = useMutation({
    mutationFn: async () => {
      if (selectedProducts.length == 0) {
        throw new Error("No products selected");
      }
      const outOfStockProducts = selectedProducts.filter(
        (product) => product.stock < product.quantity,
      );
      const outOfStockProductIds = outOfStockProducts.map(
        (product) => product.id,
      );
      setInsufficientStockProducts(outOfStockProductIds);
      if (outOfStockProductIds.length > 0) {
        throw new Error(`Not enough stock`);
      }

      const orderId = await postData({
        payload: [
          {
            first_name: order?.first_name,
            user_id: null,
            last_name: order?.last_name,
            phone_number: order?.phone_number,
            address: order?.address,
            region: order?.region,
            city: order?.city,
            additional_info: order?.additional_info,
            status: selectedStatus,
            total_price: calculateTotalPrice(selectedProducts),
            wholesale_price: calculateTotalWholesalePrice(selectedProducts),
            payment_method: "cash",
            cancel_reason: "none",
          },
        ],
        tableName: "orders",
      });
      await Promise.all(
        selectedProducts.map((product) =>
          postData({
            payload: [
              {
                quantity: product.quantity,
                product_id: product.id,
                price_before_discount: product.price * product.quantity,
                discount: product.discount * product.quantity,
                discount_type: product.discount_type || "none",
                order_id: orderId.data ? (orderId.data[0]?.id as number) : 0,
                wholesale_price: product.wholesale_price * product.quantity,
              },
            ],
            tableName: "order_products",
          }),
        ),
      );
      await Promise.all(
        selectedProducts.map((product) => {
          const newStock = product.stock - product.quantity; // Reduce stock
          return updateData({
            tableName: "products",
            payload: { stock: newStock },
            match: { id: product.id },
          });
        }),
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Added Successfully", "The Order is Added Successfully!");
      setOrder(null);
      setSelectedProducts([]);
      setStep(1);
    },

    onError: (error) => {
      toast.error(
        "Error",
        error.message || "An error occurred while adding the order.",
      );
    },
  });

  const { data: products, isLoading } = useProducts({
    page: 1,
    limit: 4,
    search: { column: "title", value: searchQuery },
  });

  const handleSelectProduct = (product: Tables<"products"> | null) => {
    if (product && !selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
      setSearchQuery("");
    }
  };

  const filteredProducts: (Tables<"products"> | null)[] =
    products?.data?.filter(
      (product: Tables<"products"> | null) =>
        !selectedProducts.find((p) => p.id === product?.id),
    ) || [];

  const calculateTotalPrice = (products: SelectedProduct[]) => {
    return products.reduce(
      (total, product) =>
        total + product.quantity * (product.price - (product.discount || 0)),
      0,
    );
  };

  const calculateTotalWholesalePrice = (products: SelectedProduct[]) => {
    return products.reduce(
      (total, product) => total + product.quantity * product.wholesale_price,
      0,
    );
  };

  return (
    <form
      className="flex w-[40rem] flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        AddOrderMutation.mutate();
      }}
    >
      <EditOrderStatus
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      <div className="flex flex-col">
        <div className="flex max-w-full items-center gap-1 rounded-lg border-2 border-gray-200 px-2">
          <Image
            src="/MagnifyingGlass.Png"
            alt="Search Icon"
            width={20}
            height={20}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 focus:outline-none"
          />
        </div>
        <div className="flex flex-col shadow-lg">
          {searchQuery &&
            filteredProducts?.map((product) => (
              <div
                key={product?.id}
                className="transform cursor-pointer border-b p-2 transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-100 hover:shadow-xl"
                onClick={() => handleSelectProduct(product)}
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={product?.imgUrl || "/path/to/default-image.png"}
                    alt={product?.title || "Product"}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                  <div>{product?.title}</div>
                </div>
              </div>
            ))}
        </div>
        <SelectedProducts
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          insufficientStockProducts={insufficientStockProducts}
        />
      </div>

      <button
        type="submit"
        className="mt-5 w-[10rem] rounded border border-slate-700 bg-slate-100 p-2 px-5 font-bold text-slate-700 duration-300 ease-in-out hover:bg-slate-600 hover:text-slate-200"
      >
        Submit Order
      </button>
    </form>
  );
}
