import type { Request } from "express";

export function detectCountry(req: Request): string {
  const cfCountry = req.headers["cf-ipcountry"];
  if (cfCountry && typeof cfCountry === "string") {
    return cfCountry.toUpperCase();
  }

  const xCountry = req.headers["x-country-code"];
  if (xCountry && typeof xCountry === "string") {
    return xCountry.toUpperCase();
  }

  return "US";
}

export function isIndianUser(req: Request): boolean {
  return detectCountry(req) === "IN";
}

export function getCurrencyForRequest(req: Request, override?: string): "usd" | "inr" {
  if (override === "inr") return "inr";
  if (override === "usd") return "usd";
  return isIndianUser(req) ? "inr" : "usd";
}
