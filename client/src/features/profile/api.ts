import { apiRequest } from "@/utils/api";

export interface Sessions {
  id: string;
  device: string;
  browserVersion: string;
  operatingSystem: string;
  ip: string;
  countryCode: string;
  state: string;
  lastActiveAt: Date;
  isCurrent: boolean;
}

const getAllSessionsApi = () => apiRequest<Sessions[]>("GET", "/auth/sessions");

const logoutSessionById = (sessionId: string) =>
  apiRequest<null>("POST", `/auth/logout/${sessionId}`);

const logoutAllSessionsApi = () => apiRequest<null>("POST", "/auth/logout/all");

export { getAllSessionsApi, logoutSessionById, logoutAllSessionsApi };
