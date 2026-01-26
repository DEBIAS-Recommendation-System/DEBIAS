"use server";
import { createClient } from "@/lib/supabase";
import { headers } from "next/headers";
export default async function signUp({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const headersList = headers();
  const header_url = headersList.get("host") || "";
  const proto = headersList.get("x-forwarded-proto") || "http";

  const supabase = createClient();
  const { data, error: signUpErr } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: `${proto}://${header_url}/auth/callback`,
    },
  });
  if (signUpErr) {
    return {
      error: { message: signUpErr?.message, type: "SignUp Error" },
    };
  }
  if (data?.user?.identities?.length === 0) {
    return {
      error: { message: "You already have an account", type: "SignUp Error" },
    };
  }
  return { data, error: null };
}
