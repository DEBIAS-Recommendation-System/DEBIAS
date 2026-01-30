"use server";
export default async function signOut() {
  // Return success - actual token clearing happens client-side
  return { success: true };
}
