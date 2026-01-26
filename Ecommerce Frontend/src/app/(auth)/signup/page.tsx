import { Sign } from "crypto";
import SignupForm from "./ui/SignupForm";
import getSession from "@/api/getSession";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { session } = await getSession();

  if (session) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignupForm />
    </div>
  );
}
