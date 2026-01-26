import { Tables } from '@/types/database.types';
import Image from 'next/image'
import React from 'react'

type SelectedProduct = Tables<"products"> & {
    quantity: number;
  };
export default function SelectedProducts({selectedProducts,setSelectedProducts,insufficientStockProducts}:{selectedProducts:SelectedProduct[];setSelectedProducts:React.Dispatch<React.SetStateAction<SelectedProduct[]>> ; insufficientStockProducts:string[]}) {
    const handleQuantityChange = (productId: string, quantity: number) => {
        setSelectedProducts((prev) =>
          prev.map((product) =>
            product.id === productId ? { ...product, quantity } : product
          )
        );
      };
    
      const handleRemoveProduct = (productId: string) => {
        setSelectedProducts((prev) => prev.filter((product) => product.id !== productId));
      };
  return (
    <div>
    {selectedProducts.length > 0 && (
        <div className="flex flex-col gap-2">
        <h4 className="text-lg mt-5 font-semibold text-gray-900">Selected Products:</h4>
        <div
        className={` ${
        selectedProducts.length > 3 ? "h-[13rem] overflow-y-auto w-full" : ""
        }`}
        >
          <div className='space-y-2 w-[70%]'>
          {selectedProducts.map((product) => (
          <div key={product.id} className='flex flex-col gap-2'>
                  <div  className="grid grid-cols-4 items-center">
                <Image
                    src={product.image_url || "/path/to/default-image.png"}
                    alt={product.title}
                    width={60}
                    height={60}
                    className="rounded-md"
                />
                <span>{product.title}</span>
                <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) =>
                    handleQuantityChange(product.id, Number(e.target.value))
                    }
                    min="1"
                    className="w-10 border px-2 py-1 focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.id)}
                    className="text-color1"
                >
                    Remove
                </button>
                </div>
                {insufficientStockProducts.includes(product.id) && (
                    <div className="text-red-500 text-sm">
                    only {product.stock} left in stock
                    </div>
                )}
          </div>

            ))}

          </div>
      
            </div>
        </div>
        )}
    </div>
 
  )
}
