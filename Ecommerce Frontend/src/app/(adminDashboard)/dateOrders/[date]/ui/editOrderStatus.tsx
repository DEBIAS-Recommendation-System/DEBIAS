"use client";
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCheck, FaClock } from 'react-icons/fa';
import { FaX } from 'react-icons/fa6';
import updateData from '@/api/updateData';
import { Enums } from '@/types/database.types';
import Dropdown from '@/components/dropDown';

export default function EditOrderStatus({ id, status }: { id: number; status: Enums<"status_type_enum"> }) {
  const [selectedStatus, setSelectedStatus] = useState<string>(status || 'Select status...');

  const queryClient = useQueryClient();

  const options = [
    { value: 'pending', label: 'Pending', color: 'text-color5' },
    { value: 'fulfilled', label: 'Fulfilled', color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-color1' },
  ];

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await updateData({
        tableName: 'orders',
        payload: { status: selectedStatus as Enums<'status_type_enum'> },
        match: { id },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['orders', id],
      });
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  const handleSelect = (value: string) => {
    setSelectedStatus(value);
    updateMutation.mutate();
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock />;
      case 'fulfilled':
        return <FaCheck />;
      case 'cancelled':
        return <FaX />;
      default:
        return null;
    }
  };

  return (
    
    <Dropdown
      classname="w-[9rem]"
      options={options}
      selectedValue={selectedStatus}
      onSelect={handleSelect}
      getIcon={getIcon}
    />
  );
}
