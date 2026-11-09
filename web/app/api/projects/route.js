import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(request) {
  const { error } = await requireUser();

  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let sql = `
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
  `;

  const params = [];

  if (status) {
    sql += " WHERE p.status = ?";
    params.push(status);
  }

  sql += " ORDER BY p.project_id DESC";

  const rows = await query(sql, params);

  const projects = rows.map((p) => ({
    ...p,
    budget: Number(p.budget),
    spent: Number(p.spent),
    area_sqft: p.area_sqft === null ? null : Number(p.area_sqft),
  }));

  return Response.json({ projects });
}


export async function POST(request) {
  const { error } = await requireUser();

  if (error) return error;

  try {
    const body = await request.json();

    const clientId = Number(body.client_id);
    const leadArchitectId = Number(body.lead_architect_id);
    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    const projectType = body.project_type;
    const location = body.location?.trim() || null;
    const areaSqft =
      body.area_sqft === "" || body.area_sqft == null
        ? null
        : Number(body.area_sqft);
    const status = body.status || "PLANNING";
    const budget = Number(body.budget);
    const startDate = body.start_date;
    const endDate = body.end_date || null;

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return Response.json(
        { error: "Please select a client." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(leadArchitectId) || leadArchitectId <= 0) {
      return Response.json(
        { error: "Please select a lead architect." },
        { status: 400 }
      );
    }

    if (!name) {
      return Response.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    if (!projectType) {
      return Response.json(
        { error: "Please select a project type." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      return Response.json(
        { error: "Budget must be greater than 0." },
        { status: 400 }
      );
    }

    if (
      areaSqft !== null &&
      (!Number.isInteger(areaSqft) || areaSqft <= 0)
    ) {
      return Response.json(
        { error: "Area must be a positive whole number." },
        { status: 400 }
      );
    }

    if (!startDate) {
      return Response.json(
        { error: "Start date is required." },
        { status: 400 }
      );
    }

    if (endDate && endDate < startDate) {
      return Response.json(
        { error: "End date cannot be before start date." },
        { status: 400 }
      );
    }

    const result = await query(
      `
        INSERT INTO projects
          (
            client_id,
            lead_architect_id,
            name,
            description,
            project_type,
            location,
            area_sqft,
            status,
            budget,
            spent,
            start_date,
            end_date
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `,
      [
        clientId,
        leadArchitectId,
        name,
        description,
        projectType,
        location,
        areaSqft,
        status,
        budget,
        startDate,
        endDate,
      ]
    );

    return Response.json(
      {
        message: "Project created successfully.",
        project_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (err) {
    const { dbError } = await import("@/lib/dberror");
    return dbError(err);
  }
}
