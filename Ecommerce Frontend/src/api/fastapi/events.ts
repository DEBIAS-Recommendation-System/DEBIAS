import apiClient from "./apiClient";
import { EventCreate, EventResponse } from "@/types/fastapi";

export const eventsApi = {
  // Create event (authenticated optional)
  create: async (data: EventCreate): Promise<EventResponse> => {
    const response = await apiClient.post<EventResponse>("/events", data);
    return response.data;
  },
};
