import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const projects = await query(
    "SELECT * FROM project_budget_status ORDER BY pct_used DESC"
  );

  const categorySpend = await query(`
    SELECT
      mc.name AS category,
      SUM(mu.line_total) AS spend
    FROM material_usage mu
    JOIN materials m
      ON m.material_id = mu.material_id
    JOIN material_categories mc
      ON mc.category_id = m.category_id
    GROUP BY mc.category_id, mc.name
    ORDER BY spend DESC
  `);

  const mostUsedMaterials = await query(`
    SELECT
      m.name AS material,
      m.unit,
      SUM(mu.quantity) AS total_qty
    FROM material_usage mu
    JOIN materials m
      ON m.material_id = mu.material_id
    GROUP BY m.material_id, m.name, m.unit
    ORDER BY total_qty DESC
    LIMIT 10
  `);

  const normalizedProjects = projects.map((p) => ({
    ...p,
    budget: Number(p.budget),
    spent: Number(p.spent),
    remaining: Number(p.remaining),
    pct_used: Number(p.pct_used ?? 0),
  }));

  const summary = {
    total_projects: normalizedProjects.length,
    total_budget: normalizedProjects.reduce((s, p) => s + p.budget, 0),
    total_spent: normalizedProjects.reduce((s, p) => s + p.spent, 0),
    near_limit: normalizedProjects.filter((p) => p.pct_used >= 80).length,
  };

  return Response.json({
    summary,
    projects: normalizedProjects,
    categorySpend: categorySpend.map((row) => ({
      category: row.category,
      spend: Number(row.spend),
    })),
    mostUsedMaterials: mostUsedMaterials.map((row) => ({
      material: row.material,
      unit: row.unit,
      total_qty: Number(row.total_qty),
    })),
  });
}
