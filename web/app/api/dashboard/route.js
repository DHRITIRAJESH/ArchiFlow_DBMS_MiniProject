import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

// Budget dashboard data: reads the project_budget_status view
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const rows = await query(
    "SELECT * FROM project_budget_status ORDER BY pct_used DESC"
  );

  // mysql2 returns DECIMAL columns as strings, so convert to numbers
  const projects = rows.map((p) => ({
    ...p,
    budget: Number(p.budget),
    spent: Number(p.spent),
    remaining: Number(p.remaining),
    pct_used: Number(p.pct_used ?? 0),
  }));

  const summary = {
    total_projects: projects.length,
    total_budget: projects.reduce((s, p) => s + p.budget, 0),
    total_spent: projects.reduce((s, p) => s + p.spent, 0),
    near_limit: projects.filter((p) => p.pct_used >= 80).length,
  };

  return Response.json({ summary, projects });
}
