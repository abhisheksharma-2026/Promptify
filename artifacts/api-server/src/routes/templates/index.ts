import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, templatesTable, categoriesTable } from "@workspace/db";
import {
  ListTemplatesQueryParams,
  GetTemplateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/templates", async (req, res): Promise<void> => {
  const params = ListTemplatesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.category) {
    conditions.push(eq(templatesTable.category, params.data.category));
  }
  if (params.data.search) {
    conditions.push(ilike(templatesTable.title, `%${params.data.search}%`));
  }

  const templates =
    conditions.length > 0
      ? await db
          .select()
          .from(templatesTable)
          .where(and(...conditions))
      : await db.select().from(templatesTable);

  res.json(templates);
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(template);
});

export default router;
