import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (res.status === 403 || res.status === 401) throw new Error("forbidden");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiFetchLax(path: string) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export function useMyClerkId() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetchLax("/api/auth/me"),
    staleTime: Infinity,
    retry: false,
  });
}

export function useAdminCheck() {
  return useQuery({
    queryKey: ["admin-whoami"],
    queryFn: () => apiFetch("/api/admin/whoami"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => apiFetch("/api/admin/overview"),
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useAdminUsers(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["admin-users", limit, offset],
    queryFn: () => apiFetch(`/api/admin/users?limit=${limit}&offset=${offset}`),
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useAdminRevenue() {
  return useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => apiFetch("/api/admin/revenue"),
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => apiFetch("/api/admin/activity"),
    staleTime: 60 * 1000,
    retry: false,
  });
}
