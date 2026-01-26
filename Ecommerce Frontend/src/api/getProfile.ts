"use server";
import { createClient } from "@/lib/supabase";
import { Tables } from "@/types/database.types";

export default async function getProfile(): Promise<{ data: Tables<"profiles"> | null; error: unknown }> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return { data: null, error: null };
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select()
    .match({ user_id: data.user.id })
    .single();

  return { data: profile as Tables<"profiles"> | null, error };
}
