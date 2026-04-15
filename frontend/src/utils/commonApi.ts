const envApi = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");
export const baseApiURL = envApi ?? "/api/v1";
