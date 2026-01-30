/**
 * Client-side event tracking utility
 * Sends events directly from the browser so console logs appear in browser devtools
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface EventCreate {
  event_type: "purchase" | "cart" | "view";
  product_id: number;
  user_id?: number;
  user_session: string;
  event_time?: string;
}

/**
 * Get the access token from localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

/**
 * Get the user_id from localStorage (stored after login)
 */
export function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem("user_id");
  return userId ? parseInt(userId) : null;
}

/**
 * Store user_id in localStorage (called after login/account fetch)
 */
export function setUserId(userId: number): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_id", userId.toString());
  }
}

/**
 * Send a single event to the backend (client-side)
 */
export async function trackEvent(event: EventCreate): Promise<{ success: boolean; error?: string }> {
  // Get user_id from localStorage if not provided
  const userId = event.user_id ?? getUserId();
  const eventWithUserId = { ...event, user_id: userId ?? undefined };

  console.log(`🔔 [EVENT TRACKING] Sending ${event.event_type.toUpperCase()} event:`, {
    type: event.event_type,
    product_id: event.product_id,
    user_session: event.user_session,
    user_id: userId,
    timestamp: new Date().toISOString()
  });

  // Get auth token if available
  const accessToken = getAccessToken();
  
  // Build headers - include auth token if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    console.log("🔑 [EVENT TRACKING] Using auth token for event");
  } else if (!userId) {
    console.warn("⚠️ [EVENT TRACKING] No auth token and no user_id - event may fail");
  }

  try {
    const response = await fetch(`${API_URL}/events/`, {
      method: "POST",
      headers,
      body: JSON.stringify(eventWithUserId),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [EVENT TRACKING] Failed to send ${event.event_type} event:`, response.status, errorText);
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log(`✅ [EVENT TRACKING] ${event.event_type.toUpperCase()} event sent successfully:`, result);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ [EVENT TRACKING] Error sending ${event.event_type} event:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send multiple events in a batch (client-side)
 */
export async function trackBatchEvents(events: EventCreate[]): Promise<{ success: boolean; error?: string }> {
  // Get user_id for events that don't have one
  const userId = getUserId();
  const eventsWithUserId = events.map(event => ({
    ...event,
    user_id: event.user_id ?? userId ?? undefined
  }));

  const eventSummary = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`🔔 [EVENT TRACKING] Sending BATCH of ${events.length} events:`, eventSummary);
  console.log(`📋 [EVENT TRACKING] Event details:`, eventsWithUserId.map(e => ({
    type: e.event_type,
    product_id: e.product_id,
    user_id: e.user_id,
  })));

  // Get auth token if available
  const accessToken = getAccessToken();
  
  // Build headers - include auth token if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    console.log("🔑 [EVENT TRACKING] Using auth token for batch events");
  } else if (!userId) {
    console.warn("⚠️ [EVENT TRACKING] No auth token and no user_id - batch events may fail");
  }

  try {
    const response = await fetch(`${API_URL}/events/batch`, {
      method: "POST",
      headers,
      body: JSON.stringify(eventsWithUserId),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [EVENT TRACKING] Failed to send batch events:`, response.status, errorText);
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log(`✅ [EVENT TRACKING] BATCH events sent successfully:`, result);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ [EVENT TRACKING] Error sending batch events:`, error);
    return { success: false, error: error.message };
  }
}
