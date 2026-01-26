"use client";
import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import cn from 'classnames';

// Generic Dropdown Component
interface DropdownProps<T> {
  options: { value: T; label: string; color?: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
  getIcon?: (value: T) => React.ReactNode; // Optional
  classname?: string; // Optional
  triggerElement?: ReactNode; // New prop for custom trigger element
}

export default function Dropdown<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  getIcon, // Optional
  classname, // Optional
  triggerElement, // New optional prop
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLDivElement | null>(null); // Generic ref for the trigger element
  const dropdownRef = useRef<HTMLUListElement | null>(null);

  const handleSelect = (value: T) => {
    onSelect(value);
    setIsOpen(false);
  };

  useEffect(() => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY, // Ensure the position works correctly when scrolling
        left: rect.left + window.scrollX,  // Adjust based on scroll to ensure proper positioning
        width: rect.width, // Set the dropdown width based on the trigger element's width
      });
    }
  }, [isOpen]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div className="relative">

          <div
            ref={triggerRef}
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-[9rem] border border-1 border-slate-700 bg-white p-2 px-3 font-semibold outline-none  items-center rounded-sm cursor-pointer flex gap-2',
              classname, // Use classname prop here
              selectedOption?.color || 'text-gray-500'
            )}
          >
            {getIcon && getIcon(selectedValue)}
            {selectedOption?.label || 'Select...'}
            {isOpen ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
          </div>
      {isOpen && createPortal(
        <ul
          ref={dropdownRef}
          className="absolute z-[9999] bg-white border rounded-md shadow-lg"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`, // Explicitly set the dropdown width based on the trigger element's width
          }}
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`text-start px-3 p-2 flex gap-2 items-center cursor-pointer hover:bg-gray-100 ${option.color}`}
            >
              {getIcon && getIcon(option.value)}
              {option.label}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
