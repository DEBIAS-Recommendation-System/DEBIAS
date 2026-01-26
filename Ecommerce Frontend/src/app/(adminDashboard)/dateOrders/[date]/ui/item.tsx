"use client";
import getProductTitleAndWholesalePrice from '@/api/products/getProductTitleAndWholesalePrice';
import { Tables } from '@/types/database.types';
import { Player } from '@lottiefiles/react-lottie-player';
import React, { useState, useEffect } from 'react';

export default function Item({ item }: { item: Tables<"order_products"> }) {
  const [title, setTitle] = useState<string | undefined>("");

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { title } = await getProductTitleAndWholesalePrice(item.product_id);
        setTitle(title);
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };

    fetchProductDetails();
  }, [item.product_id]);

  const price = item.price_before_discount - item.discount;

  return (
    <>
      {title === null ? (
        <div className="flex justify-center items-center">
          <Player
            className="m-auto"
            autoplay
            loop
            src="/AnimationLoading.json"
            style={{ height: "5rem", width: "5rem" }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-8 gap-2 text-sm text-gray-600 items-center">
          <div className='col-span-2'>{title}</div>
          <div className='text-center'>{item.quantity}</div>
          <div className='text-center'>{(price/item.quantity).toFixed(2)}</div>
          <div className='text-center col-span-2'>{(item.wholesale_price / item.quantity).toFixed(2)}</div>
          <div className='text-center'>{price.toFixed(2)}</div>
          <div className='text-center'>{(price - item.wholesale_price).toFixed(2)}</div>

        </div>
      )}
    </>
  );
}
