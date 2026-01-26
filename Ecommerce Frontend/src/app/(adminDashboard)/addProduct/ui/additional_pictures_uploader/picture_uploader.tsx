"use client";

import { useToast } from "@/hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function PictureUploader({

  images,
  setImages,
}: {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const { toast } = useToast();
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.filter(
        (file) =>
          !images.some(
            (existingFile) =>
              existingFile.name === file.name &&
              existingFile.size === file.size,
          ),
      );
      if (newFiles.length > 0) {
        setImages((prevImages) => [...prevImages, ...newFiles]);
      } else {
        toast.error("Error", "This Image already exists.");
      }
    },
    [images, setImages, toast],
  );

  const removeImage = (fileName: string) => {
    setImages((prevImages) =>
      prevImages.filter((file) => file.name !== fileName),
    );
  };

  const renderImages = () => {
    

    return images.map((file, index) => (
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
            removeImage(file.name); }}
          className="absolute right-0 top-0 cursor-pointer rounded-full bg-red-500 px-2 py-1 text-sm text-white"
        >
          X
        </div>
      </div>
    ));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col gap-5 rounded-lg border-4 border-dashed p-8 text-center ${images.length > 0 
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
          {renderImages()}
        </div>
      </div>
    </div>
  );
}
