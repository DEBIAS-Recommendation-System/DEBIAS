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
 * Send a single event to the backend (client-side)
 */
export async function trackEvent(event: EventCreate): Promise<{ success: boolean; error?: string }> {
  console.log(`🔔 [EVENT TRACKING] Sending ${event.event_type.toUpperCase()} event:`, {
    type: event.event_type,
    product_id: event.product_id,
    user_session: event.user_session,
    user_id: event.user_id,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetch(`${API_URL}/events/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
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
  const eventSummary = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`🔔 [EVENT TRACKING] Sending BATCH of ${events.length} events:`, eventSummary);
  console.log(`📋 [EVENT TRACKING] Event details:`, events.map(e => ({
    type: e.event_type,
    product_id: e.product_id,
  })));

  try {
    const response = await fetch(`${API_URL}/events/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(events),
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
