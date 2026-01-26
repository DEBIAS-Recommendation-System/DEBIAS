import { QueryClientConfig } from "@tanstack/react-query";

export const QueriesConfig: QueryClientConfig = {
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
};
