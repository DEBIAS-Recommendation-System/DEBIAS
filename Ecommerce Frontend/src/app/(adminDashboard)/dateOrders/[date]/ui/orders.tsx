"use client ";
import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pagination } from '@mui/material';
import { useOrdersPagination } from '../context/useOrdersPagination';
import { Tables } from '@/types/database.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import OrderDetails from './orderDetails';
import DeleteOrder from './deleteOrder';
import EditOrderStatus from './editOrderStatus';
import Image from 'next/image';
import useOrders from '@/hooks/data/orders/useOrders';
import { ordersQuery } from '@/hooks/data/orders/ordersQuery';
import { Player } from '@lottiefiles/react-lottie-player';

export default function Orders({ searchQuery }: { searchQuery: string }) {
  const { date } = useParams();
  const { page, setPage } = useOrdersPagination(); 
  const limit = 4; 
  const { data: orders, isLoading } = useOrders({
    date : {
      from: `${date}T00:00:00`,
      to: `${date}T23:59:59`
    },
    search: {
      columns: ["first_name","last_name"],
      value: searchQuery,
    },
    pagination: {
      page: page,
      limit,
    }
  }); 

  const queryClient = useQueryClient();

  useEffect(() => {
    if (orders?.meta?.has_next_page) {
      queryClient.prefetchQuery(
        ordersQuery({
          date : {
            from: `${date}T00:00:00`,
            to: `${date}T23:59:59`
          },
          search: {
            columns: ["first_name","last_name"],
            value: searchQuery,
          },
          pagination: {
            page: page,
            limit,
          }
        }),
      );
    }
  }, [page, orders?.meta?.has_next_page, queryClient]);

  return (
    <div className='flex flex-col gap-5'>
      <div className='grid grid-cols-7 gap-5 px-5'>
        <div className='text-center col-span-2'>Client</div>
        <div className='text-center col-span-2'>Total Price</div>
        <div className='text-center col-span-2'>Status</div>
      </div>

      <div className='flex flex-col gap-2'>
        {isLoading ? (
              <div className="m-auto flex  items-center justify-center">
              <Player
                className="m-auto"
                autoplay
                loop
                src="/AnimationLoading.json"
                style={{ height: "10rem", width: "10rem" }}
              />
            </div>
        ) : (
          
          orders?.data.map((order: Tables<"orders">) => (
            <Dialog  key={order.id}>
              <DialogTrigger>
                <div
                  className="relative py-5 px-5 cursor-pointer shadow-lg grid grid-cols-7 gap-5 font-semibold text-slate-700 bg-white rounded-lg transition-all duration-300 transform hover:bg-blue-50 hover:shadow-xl hover:scale-105"
                >
                  <h2 className="text-center col-span-2">{order.first_name} {order.last_name}</h2>
                  <h2 className="text-center col-span-2">{order.total_price} dt</h2>

                  {/* Disable parent hover effect when hovering over this child */}
                  <div
                    className="flex z-[100] justify-center col-span-2 hover:!bg-none hover:!shadow-none hover:!scale-100 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EditOrderStatus status={order.status} id={order.id} />
                  </div>

                  {/* Disable parent hover effect when hovering over this child */}
                  <div
                    className="flex justify-center hover:!bg-none hover:!shadow-none hover:!scale-100 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteOrder id={order.id} />
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent className='ml-[7rem] w-[60rem] max-w-full'>
                <DialogHeader >
                  <DialogTitle className='font-bold text-color5 text-lg'>   
                    <div className='flex justify-between pr-5'>
                        <div className="flex flex-row items-center  gap-3">
                          <div className=" font-bold uppercase text-color6 sm:text-2xl">
                          Orders Details
                          </div>
                      </div>
                      <div className={`className='font-semibold' ${getStatusTextColor(order.status)}`}>{order.status.toUpperCase()}</div>
                      
                  </div>   
                   
                  </DialogTitle>
 
                </DialogHeader>
                  <OrderDetails order={order} />
    
              </DialogContent>
            </Dialog>
          ))
        )}
      </div>

      <Pagination
        className="flex w-full justify-center"
        count={orders?.meta?.total_pages}
        page={page}
        boundaryCount={3}
        siblingCount={3}
        onChange={(e, value) => setPage(value)}
      />
    </div>
  );
}
const getStatusTextColor = (status:string) => {
  switch (status) {
    case "pending":
      return "text-color5";  // Customize the class based on your design
    case "fulfilled":
      return "text-green-600";
    case "cancelled":
      return "text-color1";
    default:
      return "text-gray-500"; // Default text color when nothing is selected
  }
};