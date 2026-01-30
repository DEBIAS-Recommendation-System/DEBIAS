"use server";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

interface UploadResult {
  data: { path: string } | null;
  error: Error | null;
}

export async function UploadToBucket({
  file,
  fileName,
  bucketName,
}: {
  file: File;
  fileName: string;
  bucketName: string;
}): Promise<UploadResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
  return { data, error };
}
