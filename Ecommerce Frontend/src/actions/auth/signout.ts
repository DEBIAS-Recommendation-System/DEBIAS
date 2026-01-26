"use server";
import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
export default async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return {
      error,
    };
  } else {
    redirect("/login");
  }
}
