import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as any).auth;
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const adminId = process.env.ADMIN_USER_ID;
  if (!adminId) {
    res.status(403).json({ error: "Admin not configured" });
    return;
  }

  if (auth.userId !== adminId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
