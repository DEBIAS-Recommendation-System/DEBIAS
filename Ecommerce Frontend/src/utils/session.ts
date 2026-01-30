/**
 * Get or create a session ID for tracking anonymous users
 * This is a client-side utility function
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem("user_session");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("user_session", sessionId);
  }
  return sessionId;
}
