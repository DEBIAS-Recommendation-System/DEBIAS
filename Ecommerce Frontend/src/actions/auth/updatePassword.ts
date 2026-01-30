"use server";
import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
export default async function updatePassword({
  newPassword,
}: {
  newPassword: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) {
    return {
      error: {
        message: error.message,
        type: "Server Error",
      },
    };
  } else {
    redirect("/");
  }
}
