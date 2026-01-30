"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function signUp({
  full_name,
  username,
  email,
  password,
}: {
  full_name: string;
  username: string;
  email: string;
  password: string;
}) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name,
        username,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: {
          message: errorData.detail || "Signup failed",
          type: "SignUp Error",
        },
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Network error",
        type: "SignUp Error",
      },
    };
  }
}
