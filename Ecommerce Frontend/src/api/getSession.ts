"use server";
import { createClient } from "@/lib/supabase";
export default async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return {
    session: user
      ? {
          user,
        }
      : null,
    error,
  };
}
