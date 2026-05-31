import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Returns the current authenticated user's Clerk ID — used by the admin setup screen
router.get("/auth/me", (req: any, res) => {
  const userId = req.auth?.userId ?? null;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ userId });
});

export default router;
