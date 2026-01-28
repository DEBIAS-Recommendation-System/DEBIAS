import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { eventsApi } from "@/api/fastapi";
import { EventCreate, EventResponse } from "@/types/fastapi";
import { toast } from "sonner";

// Create event
export const useCreateEvent = (): UseMutationResult<EventResponse, Error, EventCreate> => {
  return useMutation({
    mutationFn: (data: EventCreate) => eventsApi.create(data),
    onSuccess: (data) => {
      // Events typically don't need success toast as they're tracked silently
      console.log("Event tracked:", data.message);
    },
    onError: (error: any) => {
      // Events typically fail silently, but log for debugging
      console.error("Failed to track event:", error?.response?.data?.detail || error?.message);
    },
  });
};
