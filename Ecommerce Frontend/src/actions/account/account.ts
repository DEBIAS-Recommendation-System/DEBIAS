"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getMyInfo() {
  try {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      return { data: null, error: { message: "Not authenticated", type: "Auth Error" } };
    }

    const response = await fetch(`${API_URL}/me/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.detail || "Failed to fetch user info",
          type: "Fetch Error",
        },
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : "Network error",
        type: "Network Error",
      },
    };
  }
}

export async function updateMyInfo({
  username,
  email,
  full_name,
}: {
  username: string;
  email: string;
  full_name: string;
}) {
  try {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      return { data: null, error: { message: "Not authenticated", type: "Auth Error" } };
    }

    const response = await fetch(`${API_URL}/me/`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        full_name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.detail || "Failed to update user info",
          type: "Update Error",
        },
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : "Network error",
        type: "Network Error",
      },
    };
  }
}

export async function deleteMyAccount() {
  try {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      return { data: null, error: { message: "Not authenticated", type: "Auth Error" } };
    }

    const response = await fetch(`${API_URL}/me/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.detail || "Failed to delete account",
          type: "Delete Error",
        },
      };
    }

    const data = await response.json();
    
    // Clear tokens after successful account deletion
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : "Network error",
        type: "Network Error",
      },
    };
  }
}
