"use client";
import updateData from "@/api/updateData";
import { useToast } from "@/hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteSavedImageMutation = ({
  updatedImages,
  id,
}: {
  updatedImages: string[];
  id: string;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await updateData({
        tableName: "products",
        payload: {
          extra_images_urls: updatedImages,
        },
        match: {
          id:id,
        },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Success!", "Image Deleted successfully!");
      await queryClient.invalidateQueries({
        queryKey: ["products", { id }],
      });
    },
    onError: (error) => {
      toast.error(
        "Error",
        error.message || "An error occurred while deleting the Picture."
      );
    },
  });
};
