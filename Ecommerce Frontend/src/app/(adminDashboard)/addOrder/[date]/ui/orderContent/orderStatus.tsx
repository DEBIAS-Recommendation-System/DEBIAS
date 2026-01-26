"use client";
import React, { useState } from 'react';
import { FaCheck, FaClock } from 'react-icons/fa';
import { Enums } from '@/types/database.types';
import Dropdown from '@/components/dropDown';
import { FaX } from 'react-icons/fa6';

export default function EditOrderStatus({
  selectedStatus,
  setSelectedStatus,
}: {
  selectedStatus: Enums<"status_type_enum">;
  setSelectedStatus: React.Dispatch<React.SetStateAction<Enums<"status_type_enum">>>;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const options :  { value: Enums<"status_type_enum">; label: string; color?: string }[] = [
    { value: 'pending', label: 'Pending', color: 'text-color5' },
    { value: 'fulfilled', label: 'Fulfilled', color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-color1' },
  ];

  const handleSelect = (value: Enums<"status_type_enum">) => {
    setSelectedStatus(value);
    setIsOpen(false);
  };

  return (
    <Dropdown
      classname="w-[9rem]"
      options={options}
      selectedValue={selectedStatus}
      onSelect={handleSelect}
      getIcon={getStatusIcon}
    />
  );
}

const getStatusIcon = (status: Enums<"status_type_enum">) => {
  switch (status) {
    case 'pending':
      return <FaClock />;
    case 'fulfilled':
      return <FaCheck />;
    case 'cancelled':
      return <FaX/>;
    default:
      return null; // or any fallback icon if necessary
  }
};
