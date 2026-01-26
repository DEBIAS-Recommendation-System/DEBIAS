"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import updateData from "@/api/updateData";
import { SelectGeneric } from "@/app/ui/SelectGeneric";
import { uploadFile } from "@/api/uploadFile";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/useToast";
import PictureUploader from "./ui/picture_uploader";
import { Player } from "@lottiefiles/react-lottie-player";
import { Enums } from "@/types/database.types";
import { slugify } from "@/helpers/slugify";
import useProductBySlug from "@/hooks/data/products/useProductBySlug";

const schema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  price: z.number().positive("Le prix doit être un nombre positif"),
  discount: z.number().optional(),
  stock: z.number().optional(),
  wholesalePrice: z.number().optional(),
  category_id: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    message: "Catégorie invalide",
  }),
});

export default function Page() {
  const { slug } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const decodedSlug = decodeURIComponent(Array.isArray(slug) ? slug[0] : slug);
  const { data: product, isLoading } = useProductBySlug(String(decodedSlug));
  const [preview, setPreview] = useState<string>(
    product.data?.image_url ?? "/noArticlePic.png",
  );
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    if (product?.data?.image_url) {
      setPreview(product.data.image_url);
    }
  }, [product?.data?.image_url]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const Options = [
    { label: "Jeux de concentration", value: "1" },
    { label: "Social", value: "2" },
    { label: "Construction", value: "3" },
  ];

  const UpdateArticleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const title = String(formData.get("title"));
      const subtitle = String(formData.get("subtitle"));
      const price = Number(formData.get("price"));
      const discount = Number(formData.get("discount"));
      const stock = Number(formData.get("stock"));
      const description = String(formData.get("description"));
      const category_id = Number(formData.get("category_id"));
      const wholesale_price = Number(formData.get("wholesale_price"));
      const filepicture = formData.get("filepicture") as File;

      const result = schema.safeParse({
        title,
        subtitle,
        price,
        discount,
        stock,
        description,
        category_id: category_id,
        wholesale_price,
      });
      if (!result.success) throw new Error("Erreur de validation");

      let image_url = product?.data?.image_url;
      if (filepicture.size > 0) {
        image_url = await uploadFile({
          formData,
          name: "filepicture",
          title: uuidv4(),
        });
      }

      const newExtraImagesUrls = product?.data?.extra_images_urls ?? [];
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const formDataImage = new FormData();
          formDataImage.append("file", file);
          const uploadedUrl = await uploadFile({
            formData: formDataImage,
            name: "file",
            title: uuidv4(),
          });
          newExtraImagesUrls.push(uploadedUrl);
        }
      }
      setImages([]);

      const payload = {
        image_url,
        title,
        subtitle,
        price,
        discount,
        stock,
        description,
        discount_type: "fixed" as Enums<"discount_type_enum">,
        category_id,
        wholesale_price,
        extra_images_urls: newExtraImagesUrls,
        slug: slugify(title),
      };
      const match = { id: product?.data?.id };

      const { data, error } = await updateData({
        tableName: "products",
        payload,
        match,
      });
      if (error) throw new Error(error.message || "Erreur de mise à jour");

      return data;
    },
    onSuccess: () => {
      toast.success("Succès!", "Produit mis à jour avec succès!");
      queryClient.invalidateQueries({ queryKey: ["products", { slug }] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast.error(
        "Erreur",
        error.message || "Une erreur s'est produite lors de la mise à jour.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="m-auto flex min-h-screen items-center justify-center">
        <Player
          className="m-auto"
          autoplay
          loop
          src="/AnimationLoading.json"
          style={{ height: "12rem", width: "12rem" }}
        />
      </div>
    );
  }

  return (
    <form
      action={UpdateArticleMutation.mutate}
      className="m-auto mt-20 flex w-full max-w-[50rem] flex-col justify-center gap-5 px-4 pb-4 sm:px-10"
    >
      <div className="flex flex-row items-center justify-center gap-3">
        <Image
          src="/home/icons/flower_yellow.png"
          alt=""
          height={15}
          width={15}
        />
        <div className="text-xl font-bold uppercase text-color5 sm:text-2xl">
          Modifier l'article
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
              Titre du produit :
            </div>
            <input
              className="tx-lg w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
              type="text"
              placeholder="Titre du produit..."
              name="title"
              defaultValue={product?.data?.title || ""}
            />
          </div>

          <div className="flex h-full flex-col gap-3">
            <div className="text-sm font-semibold text-gray-900">
              Description :
            </div>
            <textarea
              className="h-full border-[1px] border-gray-200 px-4 py-2 text-base text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none"
              placeholder="Description..."
              name="description"
              defaultValue={product?.data?.description || ""}
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
            src={preview}
            width={150}
            height={150}
            alt="Photo de l'article"
            className="m-auto"
          />
          <input
            name="filepicture"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
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
          defaultValue={product?.data?.subtitle || ""}
        />
      </div>

      <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-12">
        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Prix original :
        </div>
        <input
          className="tx-base w-full border-[1px] border-gray-200 px-4 py-2 text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none sm:col-span-4"
          type="number"
          step="0.01"
          placeholder="Prix..."
          name="price"
          defaultValue={product?.data?.price || ""}
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
          defaultValue={product?.data?.discount || ""}
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
          defaultValue={product?.data?.stock || ""}
        />

        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Prix de gros :
        </div>
        <input
          className="w-full border-[1px] border-gray-200 px-4 py-2 text-base text-gray-500 placeholder:text-sm placeholder:text-gray-300 focus:outline-none sm:col-span-4"
          type="number"
          step="0.01"
          placeholder="Prix de gros..."
          name="wholesale_price"
          defaultValue={product?.data?.wholesale_price || ""}
        />

        <div className="text-sm font-semibold text-gray-900 sm:col-span-2">
          Catégorie :
        </div>
        <SelectGeneric
          name="category_id"
          className="w-full placeholder:text-sm placeholder:text-gray-300 sm:col-span-4"
          inputLabel="Sélectionner une catégorie..."
          options={Options}
          defaultValue={Options.find(
            (option) => option.value === String(product?.data?.category_id),
          )}
        />
      </div>

      <PictureUploader
        images={images}
        setImages={setImages}
        savedImages={product?.data?.extra_images_urls ?? []}
        productId={product.data?.id as string}
      />

      <button
        className="mt-5 w-[10rem] rounded border border-slate-700 bg-slate-100 p-2 px-5 font-bold text-slate-700 duration-300 ease-in-out hover:!bg-slate-600 hover:!text-slate-200"
        type="submit"
        disabled={UpdateArticleMutation.isPending}
      >
        {UpdateArticleMutation.isPending ? "Chargement..." : "Soumettre"}
      </button>
    </form>
  );
}
