"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default async function login({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  try {
    // FastAPI OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: {
          message: errorData.detail || "Login failed",
          type: "Login Error",
        },
      };
    }

    const data = await response.json();
    
    // Store tokens in localStorage (you might want to use httpOnly cookies instead)
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    return { error: null, data };
  } catch (error: any) {
    return {
      error: {
        message: error.message || "An unexpected error occurred",
        type: "Login Error",
      },
    };
  }
}
