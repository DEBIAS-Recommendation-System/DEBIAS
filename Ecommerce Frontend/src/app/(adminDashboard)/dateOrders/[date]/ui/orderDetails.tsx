"use client";
import useOrdersById from '@/hooks/data/orders/useOrderById';
import React from 'react';
import Item from './item';
import { Player } from '@lottiefiles/react-lottie-player';
import { Enums, Tables } from '@/types/database.types';

export default function OrderDetails({ order }: { order: Tables<"orders"> }) {
  console.log("🚀 ~ OrderDetails ~ order:", order.id)
  const { data: orderDetails, isPending } = useOrdersById(order.id);
  console.log("🚀 ~ OrderDetails ~ orderDetails:", orderDetails)
  const client = order.first_name + " " + order.last_name;
  const address = order.region + ", " + order.city + ", " + order.additional_info;

  return (
    <div className='flex flex-col gap-6 mt-4 bg-white shadow-lg p-6 rounded-lg'>
      <div>
        <div className='text-xl font-semibold text-gray-800 mb-4'>Customer Information</div>
        <div className='grid grid-cols-2 gap-3 items-start'>
          <div className='flex gap-4 items-center'>
            <span className='text-sm text-gray-600'>Client Name:</span>
            <span className='text-base font-medium text-gray-900'>{client?.toUpperCase()}</span>
          </div>
          <div className='flex gap-4 items-center'>
            <span className='text-sm text-gray-600'>Phone:</span>
            <span className="text-base font-medium text-gray-900">{order.phone_number}</span>
          </div>
          <div className='flex gap-4 items-center'>
            <span className='text-sm text-gray-600'>Email:</span>
            <span className="text-base font-medium text-gray-900">{order.address}</span>
          </div>
          <div className='flex gap-4 items-center'>
            <span className='text-sm text-gray-600'>Address:</span>
            <span className="text-base font-medium text-gray-900">{address}</span>
          </div>
        </div>
      </div>

      <div>
        <div className='text-xl font-semibold text-gray-800 mb-4'>Order Summary</div>
        <div className='grid grid-cols-8 gap-4 text-gray-600 font-semibold text-sm'>
          <div className='col-span-2'>Product</div>
          <div className='text-center'>Quantity</div>
          <div className='text-center'>Unit Price</div>
          <div className='col-span-2 text-center'>Unit Wholesale Price</div>
          <div className='text-center'>Total Price</div>
          <div className='text-center'>Income</div>
        </div>

        {isPending ? (
          <div className="flex justify-center items-center">
            <Player
              className="m-auto"
              autoplay
              loop
              src="/AnimationLoading.json"
              style={{ height: "6rem", width: "6rem" }}
            />
          </div>
        ) : (
          <>
            <div
              className={`flex flex-col w-full gap-1 mt-2 ${orderDetails?.data.orderProducts && orderDetails.data.orderProducts?.length > 0 ? ' overflow-y-auto ' : ''
              }`}
            >
              {orderDetails?.data.orderProducts?.map((item ) => (
                <Item key={item.id} item={item} />
              ))}
            </div>

            <div className='flex gap-6 text-lg text-gray-800 mt-6'>
            <div className='flex gap-2 items-center'>
              <span className='text-sm text-gray-600'>Total Price:</span>
              <span className='text-base font-bold text-gray-900'>{order.total_price.toFixed(2)}</span>
            </div>

            <div className='flex gap-2 items-center'>
              <span className='text-sm text-gray-600'>Total Income:</span>
              <span className='text-base font-bold text-gray-900'>{(order.total_price - order.wholesale_price).toFixed(2)}</span>
            </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
