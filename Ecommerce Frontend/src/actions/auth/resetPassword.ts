"use server";
import { createClient } from "@/lib/supabase";
import { headers } from "next/headers";
export default async function resetPassword({ email }: { email: string }) {
  const proto = headers().get("x-forwarded-proto") || "http";
  const header_url = headers().get("host") || "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${header_url}/auth/forgetPassword`,
  });
  if (error) {
    return {
      error: {
        message: error.message,
        type: "Server Error",
      },
    };
  } else {
    return {
      error: null,
    };
  }
}
