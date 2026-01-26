"use client";
import { useDeleteSavedImageMutation } from "@/hooks/data/products/updateSavedImages";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Images from "./Images";

export default function PictureUploader({
  productId,
  savedImages,
  images,
  setImages,
}: {
  savedImages: string[];
  productId: string;
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const [updatedImages , setUpdatedImages] = React.useState<string[]>(savedImages);
  const { toast } = useToast();
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.filter(
        (file) =>
          !images.some(
            (existingFile) =>
              existingFile.name === file.name && existingFile.size === file.size
          )
      );
      if (newFiles.length > 0) {
        setImages((prevImages) => [...prevImages, ...newFiles]);
      } else {
        toast.error("Error", "This Image already exists.");
      }
    },
    [images, setImages, toast]
  );


 

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col gap-5 rounded-lg border-4 border-dashed p-8 text-center ${
          images.length > 0 || (savedImages && savedImages?.length > 0)
            ? "pb-0"
            : ""
        } ${isDragActive ? "border-green-500" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-green-500">Drop the images here ...</p>
        ) : (
          <p className="text-gray-500">
            Drag and drop some images here, or click to select images
          </p>
        )}
        <div className="m-auto mt-4 flex w-full flex-wrap justify-center">
        <Images  images={images} setImages={setImages} updatedImages={updatedImages} setUpdatedImages={setUpdatedImages} id={productId}   />

        </div>
      </div>
    </div>
  );
}
