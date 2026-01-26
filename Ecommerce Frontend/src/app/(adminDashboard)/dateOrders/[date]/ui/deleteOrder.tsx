"use client";
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaTrash } from 'react-icons/fa';
import deleteData from '@/api/deleteData';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DeleteOrder({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const DeleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await deleteData({ tableName: 'orders', match: { id } });
      if (error) throw new Error(error.message); // Removed `error.message` as `error` is already a string.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
    onError: (error) => {
      console.error("Delete failed:", error);
    },
  });

  return (
    <Dialog>
      <DialogTrigger><FaTrash className='hover:text-gray-500' /></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            <div className='flex flex-col gap-5'>
              <div>
                This action cannot be undone. This will permanently delete this order
                and remove its data from the database.
              </div>
              <div className='flex justify-between'>
                <DialogTrigger asChild>
                  <button
                    className={`flex h-[2.5rem] w-[10rem] items-center justify-center rounded-r-sm border border-slate-700  px-3 py-2 text-center text-sm font-semibold capitalize  transition-all ease-linear text-white bg-slate-700 hover:bg-white hover:text-slate-700`}
                  >
                    Cancel
                  </button>
                </DialogTrigger>
                <button
                  onClick={() => DeleteMutation.mutate()}
                  className={`flex h-[2.5rem] w-[10rem] items-center justify-center rounded-r-sm border border-slate-700 bg-white px-3 py-2 text-center text-sm font-semibold capitalize text-slate-700 transition-all ease-linear hover:bg-slate-700 hover:text-white`}
                >
                  Yes
                </button>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
