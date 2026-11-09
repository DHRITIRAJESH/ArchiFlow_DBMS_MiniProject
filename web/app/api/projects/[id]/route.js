import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(request, { params }) {
  const { error } = await requireUser();

  if (error) return error;

  const { id } = await params;

  const projectRows = await query(
    `
      SELECT
        p.project_id,
        p.name,
        p.description,
        p.project_type,
        p.location,
        p.area_sqft,
        p.status,
        p.budget,
        p.spent,
        p.start_date,
        p.end_date,
        c.client_id,
        c.name AS client_name,
        u.user_id AS lead_architect_id,
        u.full_name AS lead_architect_name
      FROM projects p
      JOIN clients c ON c.client_id = p.client_id
      JOIN users u ON u.user_id = p.lead_architect_id
      WHERE p.project_id = ?
    `,
    [id]
  );

  if (projectRows.length === 0) {
    return Response.json(
      { error: "Project not found." },
      { status: 404 }
    );
  }

  const usageRows = await query(
    `
      SELECT
        mu.usage_id,
        mu.quantity,
        mu.unit_price,
        mu.line_total,
        mu.area_applied,
        mu.used_on,
        m.material_id,
        m.name AS material_name,
        m.unit,
        mc.category_id,
        mc.name AS category_name,
        s.supplier_id,
        s.name AS supplier_name
      FROM material_usage mu
      JOIN materials m
        ON m.material_id = mu.material_id
      JOIN material_categories mc
        ON mc.category_id = m.category_id
      JOIN suppliers s
        ON s.supplier_id = mu.supplier_id
      WHERE mu.project_id = ?
      ORDER BY mu.used_on DESC, mu.usage_id DESC
    `,
    [id]
  );

  const categoryRows = await query(
    `
      SELECT
        mc.category_id,
        mc.name AS category_name,
        COALESCE(SUM(mu.line_total), 0) AS spent
      FROM material_usage mu
      JOIN materials m
        ON m.material_id = mu.material_id
      JOIN material_categories mc
        ON mc.category_id = m.category_id
      WHERE mu.project_id = ?
      GROUP BY mc.category_id, mc.name
      ORDER BY spent DESC
    `,
    [id]
  );

  const project = {
    ...projectRows[0],
    budget: Number(projectRows[0].budget),
    spent: Number(projectRows[0].spent),
    area_sqft:
      projectRows[0].area_sqft === null
        ? null
        : Number(projectRows[0].area_sqft),
  };

  const usage = usageRows.map((row) => ({
    ...row,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    line_total: Number(row.line_total),
  }));

  const categorySpend = categoryRows.map((row) => ({
    ...row,
    spent: Number(row.spent),
  }));

  return Response.json({
    project,
    usage,
    categorySpend,
  });
}
export async function PUT(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();

    const {
      client_id,
      lead_architect_id,
      name,
      description,
      project_type,
      location,
      area_sqft,
      status,
      budget,
      start_date,
      end_date,
    } = body;

    const clientId = Number(client_id);
    const architectId = Number(lead_architect_id);
    const area = area_sqft === "" || area_sqft == null
      ? null
      : Number(area_sqft);
    const newBudget = Number(budget);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return Response.json(
        { error: "Please select a valid client." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(architectId) || architectId <= 0) {
      return Response.json(
        { error: "Please select a valid lead architect." },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return Response.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    if (!project_type) {
      return Response.json(
        { error: "Project type is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(newBudget) || newBudget <= 0) {
      return Response.json(
        { error: "Budget must be greater than 0." },
        { status: 400 }
      );
    }

    if (
      area !== null &&
      (!Number.isFinite(area) || area <= 0)
    ) {
      return Response.json(
        { error: "Area must be greater than 0." },
        { status: 400 }
      );
    }

    if (!start_date) {
      return Response.json(
        { error: "Start date is required." },
        { status: 400 }
      );
    }

    if (end_date && end_date < start_date) {
      return Response.json(
        { error: "End date cannot be before the start date." },
        { status: 400 }
      );
    }

    const existingRows = await query(
      `
        SELECT spent
        FROM projects
        WHERE project_id = ?
      `,
      [id]
    );

    if (existingRows.length === 0) {
      return Response.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const spent = Number(existingRows[0].spent);

    if (newBudget < spent) {
      return Response.json(
        {
          error: `Budget cannot be less than the amount already spent (₹${spent.toLocaleString("en-IN")}).`,
        },
        { status: 400 }
      );
    }

    await query(
      `
        UPDATE projects
        SET
          client_id = ?,
          lead_architect_id = ?,
          name = ?,
          description = ?,
          project_type = ?,
          location = ?,
          area_sqft = ?,
          status = ?,
          budget = ?,
          start_date = ?,
          end_date = ?
        WHERE project_id = ?
      `,
      [
        clientId,
        architectId,
        name.trim(),
        description?.trim() || null,
        project_type,
        location?.trim() || null,
        area,
        status,
        newBudget,
        start_date,
        end_date || null,
        id,
      ]
    );

    return Response.json({
      message: "Project updated successfully.",
    });
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error);

    return Response.json(
      { error: "Failed to update project." },
      { status: 500 }
    );
  }
}
