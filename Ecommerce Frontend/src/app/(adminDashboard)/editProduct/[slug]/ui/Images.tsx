"use client";

import { useDeleteSavedImageMutation } from "@/hooks/data/products/updateSavedImages";
import Image from "next/image";

export default function Images({images, setImages, setUpdatedImages, updatedImages , id } : {images: File[]; updatedImages: string[]; id: string; setImages: React.Dispatch<React.SetStateAction<File[]>> ; setUpdatedImages: React.Dispatch<React.SetStateAction<string[]>>}) {
    const deleteSavedImageMutation = useDeleteSavedImageMutation({
      updatedImages,
      id,
    })
      const removeImage = (fileName: string) => {
        setImages((prevImages) =>
          prevImages.filter((file) => file.name !== fileName)
        );
      };
    const deleteSavedImage = (url: string) => {
      setUpdatedImages (updatedImages.filter((img) =>
        typeof img === "string" ? img !== url : true))
      deleteSavedImageMutation.mutate(); 
    };
  
    return [...images,...updatedImages].map((file, index) => (
      <div
        key={index}
        className="relative m-2 h-32 w-32 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={file instanceof File ? URL.createObjectURL(file) : file}
          alt={file instanceof File ? file.name : `Saved image ${index}`}
          className="h-full w-full rounded-md object-cover"
          width={500}
          height={500}
          draggable={false}
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (file instanceof File) {
              removeImage(file.name);
            } else {
              deleteSavedImage(file);
            }
          }}
          className="absolute right-0 top-0 cursor-pointer rounded-full bg-red-500 px-2 py-1 text-sm text-white"
        >
          X
        </div>
      </div>
    ));
  };