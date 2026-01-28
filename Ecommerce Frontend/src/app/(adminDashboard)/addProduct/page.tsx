"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Image from "next/image";
import { uploadFile } from "@/api/uploadFile";
import postData from "@/api/postData";
import { SelectGeneric } from "@/app/ui/SelectGeneric";
import { useToast } from "@/hooks/useToast";
import { v4 as uuidv4 } from "uuid";
import PictureUploader from "./ui/additional_pictures_uploader/picture_uploader";
import { slugify } from "@/helpers/slugify";

const schema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  price: z.number().positive("Le prix doit être un nombre positif"),
  discount: z.number().optional(),
  stock: z.number().optional(),
  wholesalePrice: z
    .number()
    .optional(),
  category_id: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    message: "Catégorie invalide",
  }),
});

export const dynamic = 'force-dynamic';

export default function Page() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null); // Create form reference
  const Options = [
    { label: "Jeux de concentration", value: "1" },
    { label: "Social", value: "2" },
    { label: "Construction", value: "3" },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const AddArticleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = schema.safeParse({
        title: formData.get("title"),
        price: Number(formData.get("price")),
        discount: Number(formData.get("discount")),
        stock: Number(formData.get("stock")),
        description: formData.get("description"),
        subtitle: formData.get("subtitle"),
        wholesalePrice: Number(formData.get("wholesalePrice")),
        category_id: Number(formData.get("category_id")),
      });

      if (!result.success) {
        const errorMessages = result.error.errors[0].message;
        throw new Error(errorMessages);
      }

      // The rest of your mutation function remains unchanged
      let image_url = "";
      const filepicture = formData.get("filepicture") as File;
      if (filepicture && filepicture.size > 0) {
        image_url = await uploadFile({
          formData,
          name: "filepicture",
          title: uuidv4(),
        });
      } else {
        throw new Error("Product Image is Required.");
      }

      let extra_images_urls: string[] = [];
      if (images.length > 0) {
        await Promise.all(
          images.map(async (image) => {
            const formDataImage = new FormData();
            formDataImage.append("file", image);
            const uploadedUrl = await uploadFile({
              formData: formDataImage,
              name: "file",
              title: uuidv4(),
            });
            extra_images_urls.push(uploadedUrl);
          }),
        );
      }

      const { error } = await postData({
        payload: [
          {
            title: String(formData.get("title")),
            price: Number(formData.get("price")),
            stock: Number(formData.get("stock")),
            description: String(formData.get("description")),
            subtitle: String(formData.get("subtitle")),
            discount: Number(formData.get("discount")),
            discount_type: "fixed",
            wholesale_price: Number(formData.get("wholesalePrice")),
            image_url,
            extra_images_urls,
            category_id: Number(formData.get("category_id")),
            slug: slugify(String(formData.get("title"))),
          },
        ],
        tableName: "products",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Success!", "The product was created.");
      queryClient.invalidateQueries({ queryKey: ["products"] });

      formRef.current?.reset();
      setPreview("");
      setImages([]);
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error.message || "An error occurred while adding the article.",
      );
    },
  });

  return (
    <form
      ref={formRef} // Attach form reference
      action={AddArticleMutation.mutate}
      className="m-auto mt-20 flex w-full max-w-[50rem] flex-col justify-center gap-5 px-3 pb-4 sm:px-10"
    >
      <div className="flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-lg font-bold uppercase text-color5 sm:text-2xl">
          Ajouter un nouvel Produit
        </div>
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
      </div>

      <div className="m-auto mt-5 flex w-full flex-col items-start gap-10 lg:flex-row">
        <div className="flex h-[15rem] w-full flex-col gap-5 lg:w-[30rem]">
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-gray-900">
              Titre du produit
            </div>
            <input
              className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
              type="text"
              placeholder="Titre du produit..."
              name="title"
            />
          </div>
          <div className="flex h-full flex-col gap-3">
            <div className="text-sm font-semibold text-gray-900">
              Description
            </div>
            <textarea
              className="h-full border-[1px] border-gray-200 px-4 py-2 text-base text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
              placeholder="Description..."
              name="description"
            ></textarea>
          </div>
        </div>

        <div
          className="flex h-[15rem] w-full max-w-[15rem] cursor-pointer flex-col justify-center gap-2 bg-gray-200 py-2"
          onClick={() =>
            document
              .querySelector<HTMLInputElement>('input[name="filepicture"]')
              ?.click()
          }
        >
          <Image
            src={preview || "/noArticlePic.png"}
            width={150}
            height={150}
            alt="Image de l'article"
            className="m-auto"
          />
          <input
            className="hidden"
            name="filepicture"
            type="file"
            accept="image/*"
            aria-label="Upload product image"
            onChange={handleImageChange}
          />
          <div className="mx-auto w-48 text-center text-xs text-gray-500">
            La taille de l'image doit être inférieure à 1 Mo et le ratio d'image
            doit être de 1:1
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-gray-900">
          Sous-titre du produit :
        </div>
        <input
          className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
          type="text"
          placeholder="Sous-titre du produit..."
          name="subtitle"
        />
      </div>

      <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-12">
        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Prix de Vente :
        </div>
        <input
          className="tx-base w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none sm:col-span-4"
          type="number"
          step="0.01"
          placeholder="Prix..."
          name="price"
        />
        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Remise :
        </div>
        <input
          className="tx-base w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none sm:col-span-4"
          type="number"
          step="0.01"
          placeholder="remise..."
          name="discount"
        />

        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Stock :
        </div>
        <input
          className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none sm:col-span-4"
          type="number"
          step="0.01"
          placeholder="Stock..."
          name="stock"
        />
        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Prix de gros :
        </div>
        <input
          className="w-full border-[1px] border-gray-200 px-4 py-2 text-base text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none sm:col-span-4"
          type="number"
          step="0.01"
          placeholder="Prix de gros..."
          name="wholesalePrice"
        />
        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Catégories :
        </div>
        <SelectGeneric
          name="category_id"
          className="w-full placeholder:text-sm placeholder:text-gray-300 sm:col-span-4"
          inputLabel="Sélectionnez la catégorie..."
          options={Options}
        />
      </div>
      <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
        Images supplémentaires :
      </div>
      <PictureUploader images={images} setImages={setImages} />

      <button
        className="mt-5 w-[10rem] rounded border border-slate-700 bg-slate-100 p-2 px-5 font-bold text-slate-700 duration-300 ease-in-out hover:!bg-slate-600 hover:!text-slate-200"
        type="submit"
        disabled={AddArticleMutation.isPending}
      >
        {AddArticleMutation.isPending ? "Chargement..." : "Soumettre"}
      </button>
    </form>
  );
}
