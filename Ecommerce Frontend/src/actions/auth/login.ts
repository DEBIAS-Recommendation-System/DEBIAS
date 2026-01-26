"use server";
import { createClient } from "@/lib/supabase";
export default async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return {
      error: {
        message: error.message,
        type: "Login Error",
      },
    };
  }
  return { error: null };
}
