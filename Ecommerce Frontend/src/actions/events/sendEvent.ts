"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface EventCreate {
  event_type: "purchase" | "cart" | "view";
  product_id: number;
  user_id?: number;
  user_session: string;
  event_time?: string;
}

/**
 * Send a single event to the backend
 */
export async function sendEvent(event: EventCreate, token?: string) {
  try {
    console.log(`🔔 Sending ${event.event_type.toUpperCase()} event:`, {
      type: event.event_type,
      product_id: event.product_id,
      user_session: event.user_session,
      user_id: event.user_id,
      timestamp: new Date().toISOString()
    });
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/events/`, {
      method: "POST",
      headers,
      body: JSON.stringify(event),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to send event:", response.statusText);
      return { success: false, error: response.statusText };
    }

    const result = await response.json();
    console.log(`✅ ${event.event_type.toUpperCase()} event sent successfully`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error sending event:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send multiple events in a batch
 */
export async function sendBatchEvents(events: EventCreate[], token?: string) {
  try {
    const eventSummary = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`🔔 Sending BATCH of ${events.length} events:`, eventSummary);
    console.log('Event details:', events.map(e => ({
      type: e.event_type,
      product_id: e.product_id,
      user_session: e.user_session
    })));
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/events/batch`, {
      method: "POST",
      headers,
      body: JSON.stringify(events),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to send batch events:", response.statusText);
      return { success: false, error: response.statusText };
    }

    const result = await response.json();
    console.log(`✅ Batch events sent successfully:`, eventSummary);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error sending batch events:", error);
    return { success: false, error: error.message };
  }
}
