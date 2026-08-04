const envApi = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");
const fallbackApi =
  typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/api/v1`
    : "/api/v1";

export const baseApiURL = envApi ?? fallbackApi;
