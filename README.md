# ArchiFlow — Smart Architectural Project & Material Management System

ArchiFlow is a web platform that helps architectural firms manage projects, clients, materials, suppliers and budgets, and find the right material faster. Architects can record material usage against project budgets, compare supplier prices, track price changes, and describe a requirement in plain words — for example *"affordable, low-maintenance flooring for high-traffic areas"* — to get matching materials through semantic search.

Built for the **DBMS Experiential Learning – Level 3 Project**, PES University.

---

## Features

| Module | What it does |
| --- | --- |
| **Authentication** | Login and logout with hashed passwords and session cookies; two roles (Admin, Architect) with server-side access checks |
| **Dashboard** | Total projects, budget and spending, projects nearing their budget limit, budget utilisation per project, spend by material category, most-used materials |
| **Clients** | List, search, add, edit and delete clients; project count per client; deletion blocked when a client still has projects |
| **Projects** | Project list, details, add and edit; budget, spent and remaining amounts; material usage per project |
| **Record material usage** | Records usage through a stored procedure inside a transaction; a trigger blocks any entry that would exceed the project budget, and nothing is saved |
| **Materials** | Catalogue with filters (category, durability, maintenance), cheapest supplier price, full-text keyword search, admin add and edit |
| **Supplier comparison** | All suppliers for a material ranked by price, using a stored procedure |
| **Suppliers & pricing** | Supplier list and details; admins edit prices and lead times |
| **Price history** | Every supplier price change, logged automatically by a database trigger |
| **Semantic search** | Plain-language material search using vector embeddings in Qdrant, combined with live prices from MySQL, with a side-by-side keyword search comparison |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend and API | Next.js 16 (App Router, Route Handlers) |
| Relational database | MySQL 8.0 |
| Vector database | Qdrant 1.19 |
| Embedding model | `all-MiniLM-L6-v2` (384 dimensions) via `@huggingface/transformers`, runs locally |
| Database access | `mysql2` with parameterized queries (no ORM) |
| Auth | `bcryptjs` password hashing, `iron-session` encrypted cookies |
| Seed data | Python with Faker |

### Why two databases?

- **MySQL** stores structured, related data where exact values and integrity matter: projects, budgets, clients, suppliers, prices and material usage. Constraints, triggers, stored procedures and transactions guarantee that budgets and totals are always correct.
- **Qdrant** stores vector embeddings of material descriptions, so materials can be found by **meaning** rather than exact keywords. A search for "hygienic surface for a hospital" finds epoxy flooring and anti-microbial paint even though those words weren't typed.

The two are linked by ID: each material's vector in Qdrant has the same ID as its `material_id` in MySQL.

---

## Database design

**Tables (9):** `users`, `clients`, `projects`, `material_categories`, `materials`, `suppliers`, `supplier_materials`, `material_usage`, `price_history`

The ER diagram (Chen notation) is in `ArchiFlow_ER_Diagram_Chen.pdf`. The schema is in Third Normal Form.

**Advanced database features**

| Feature | Name | Purpose |
| --- | --- | --- |
| Transaction | `record_material_usage` procedure | Inserts usage and updates project spending as one unit, rolling back on any error |
| Trigger | `trg_usage_budget_check` | Blocks usage that would exceed a project's budget |
| Trigger | `trg_price_change_log` | Logs every supplier price change to `price_history` |
| Stored procedure | `compare_suppliers` | Ranks a material's suppliers by price using a window function |
| View | `project_budget_status` | Budget, spent, remaining and % used per project |
| View | `material_cheapest_offer` | Each material's cheapest supplier |
| Indexes | 4 B-tree indexes + 1 FULLTEXT index | Faster filtering and joins; keyword search on materials |
| Constraints | PK, FK, UNIQUE, CHECK, NOT NULL, generated column | Validation and integrity at the database level |
| Vector similarity search | Qdrant `materials` collection | Cosine similarity search over material embeddings |

---

## Repository structure

```
ArchiFlow_DBMS_MiniProject/
├── web/                              Next.js web application
├── search/                           Qdrant embedding and search scripts
├── archiflow_schema_and_queries.sql  Database schema, triggers, procedures, views, sample queries
├── seed.sql                          Seed data (~440 rows)
├── archiflow_queries.sql             Sample queries for the seeded database
├── generate_seed.py                  Generates seed.sql
├── materials.csv                     Material catalogue used by the seed generator
├── ArchiFlow_ER_Diagram_Chen.pdf     ER diagram (Chen notation)
└── README.md
```

---

## Setup

### Prerequisites

- **MySQL 8.0** (with MySQL Command Line Client)
- **Node.js 20 or later** (`node -v` to check)
- **Qdrant 1.19** — either the Windows download or Docker (see step 3)
- **Python 3** with `faker` and `bcrypt` — only needed to regenerate seed data

### 1. Create and seed the database

Open the MySQL Command Line Client and run (use forward slashes in the path, even on Windows):

```sql
source C:/path/to/ArchiFlow_DBMS_MiniProject/archiflow_schema_and_queries.sql
source C:/path/to/ArchiFlow_DBMS_MiniProject/seed.sql
```

The first file creates the `archiflow` database; the second loads the full seed data and ends with `Seed complete`. Running both again resets the database.

### 2. Configure environment variables

Credentials are never committed. Each app reads them from its own local file.

**Web app** — copy `web/.env.example` to `web/.env.local` and fill it in:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=archiflow
SESSION_SECRET=any-random-text-at-least-32-characters-long
QDRANT_URL=http://localhost:6333
```

**Search scripts** — copy `search/.env.example` to `search/.env` and fill in the same MySQL details and `QDRANT_URL`.

### 3. Start Qdrant

**Option A — Windows, no Docker:** download `qdrant-x86_64-pc-windows-msvc.zip` from the [Qdrant v1.19.0 release](https://github.com/qdrant/qdrant/releases/tag/v1.19.0), extract it to `C:\qdrant`, then run:

```bash
cd C:\qdrant
.\qdrant.exe
```

**Option B — Docker:**

```bash
docker run -d --name archiflow-qdrant -p 6333:6333 -v qdrant_data:/qdrant/storage qdrant/qdrant:v1.19.0
```

Keep Qdrant running while using the app.

### 4. Load material embeddings into Qdrant (once)

```bash
cd search
npm install
npm run check     # should show "MySQL OK" and "Qdrant OK"
npm run embed     # downloads the model on first run, stores 60 materials
npm run search    # optional: test search from the terminal
```

Re-run `npm run embed` after resetting the database.

### 5. Run the web app

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:3000**.

### Demo logins

All seeded users have the password **`Archi@2026`**.

| Role | Email |
| --- | --- |
| Admin | `admin@archiflow.in` |
| Architect | Run `SELECT email FROM users WHERE role = 'ARCHITECT';` in MySQL |

---

## Seed data

| Table | Rows | Source |
| --- | --- | --- |
| users | 5 | Synthetic |
| clients | 10 | Synthetic (Faker, Indian locale) |
| projects | 10 | Synthetic with realistic descriptions |
| material_categories | 8 | Real categories |
| materials | 60 | Real product types with written descriptions and approximate Indian market prices |
| suppliers | 12 | Synthetic |
| supplier_materials | 183 | Prices within ±15–20% of market rate |
| material_usage | 145 | Inserted through the transactional procedure |
| price_history | 15 | Written by the trigger |

To regenerate: `pip install faker bcrypt`, then `python generate_seed.py`. A fixed random seed means every run produces identical data.

---

## Semantic search: how it works

1. **What is embedded:** each material's name, category, description, durability and maintenance level, combined into one text.
2. **Model:** `all-MiniLM-L6-v2`, running locally (no API key), producing 384-dimension vectors.
3. **Storage:** Qdrant collection `materials`; point ID = `material_id`; payload holds category, durability, maintenance level and cheapest price for filtering.
4. **Similarity metric:** cosine similarity.
5. **Retrieval:** the user's query is embedded, Qdrant returns the closest materials (with optional filters), and MySQL adds live supplier prices and project usage.
6. **Consistency:** when a material is added or edited, or a supplier price changes, the app updates Qdrant. MySQL remains the source of truth.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Access denied for user` | Check `DB_PASSWORD` in `web/.env.local` or `search/.env`, then restart the app |
| `Access denied for user ''@'localhost'` | `web/.env.local` is missing or in the wrong folder — it must sit directly inside `web/` |
| Search shows a Qdrant error | Start Qdrant (step 3) |
| Search returns no results | Run `npm run embed` in `search/` |
| Changes to `.env.local` not taking effect | Stop the app with Ctrl + C and run `npm run dev` again |

---

## Team

| Member | GitHub | Contributions |
| --- | --- | --- |
| Dhriti Rajesh | [@DHRITIRAJESH](https://github.com/DHRITIRAJESH) | Web app foundation, authentication and roles, dashboard, clients, projects, record material usage |
| Raina Kareem | [@rainarijo](https://github.com/rainarijo) | Database schema and seed data, Qdrant semantic search, materials, supplier comparison, suppliers and pricing, price history |

Both members contributed to the ER diagram, database design, testing and documentation.
