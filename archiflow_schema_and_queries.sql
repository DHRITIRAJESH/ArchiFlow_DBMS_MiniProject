-- =====================================================================
-- ArchiFlow — Smart Architectural Project & Material Management System
-- MySQL 8.0  |  Schema (DDL), advanced features, sample data, sample queries
-- =====================================================================

DROP DATABASE IF EXISTS archiflow;
CREATE DATABASE archiflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE archiflow;

-- ---------------------------------------------------------------------
-- 1. TABLES (CREATE, primary keys, foreign keys, constraints)
-- ---------------------------------------------------------------------

CREATE TABLE users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,              -- bcrypt hash, never plain text
  role           ENUM('ADMIN','ARCHITECT') NOT NULL DEFAULT 'ARCHITECT',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_email CHECK (email LIKE '%_@_%._%')
);

CREATE TABLE clients (
  client_id   INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(150) UNIQUE,
  phone       VARCHAR(15),
  city        VARCHAR(60),
  CONSTRAINT chk_clients_phone CHECK (phone IS NULL OR phone REGEXP '^[0-9+ -]{7,15}$')
);

CREATE TABLE projects (
  project_id         INT AUTO_INCREMENT PRIMARY KEY,
  client_id          INT NOT NULL,
  lead_architect_id  INT NOT NULL,
  name               VARCHAR(150) NOT NULL,
  description        TEXT,                           -- also embedded into Qdrant
  project_type       ENUM('RESIDENTIAL','COMMERCIAL','HOSPITALITY','INSTITUTIONAL','INTERIOR') NOT NULL,
  location           VARCHAR(100),
  status             ENUM('PLANNING','IN_PROGRESS','ON_HOLD','COMPLETED') NOT NULL DEFAULT 'PLANNING',
  budget             DECIMAL(14,2) NOT NULL,
  spent              DECIMAL(14,2) NOT NULL DEFAULT 0,
  start_date         DATE NOT NULL,
  end_date           DATE,
  CONSTRAINT fk_projects_client    FOREIGN KEY (client_id) REFERENCES clients(client_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_projects_architect FOREIGN KEY (lead_architect_id) REFERENCES users(user_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_projects_budget CHECK (budget > 0),
  CONSTRAINT chk_projects_spent  CHECK (spent >= 0),
  CONSTRAINT chk_projects_dates  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE material_categories (
  category_id  INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE materials (
  material_id        INT AUTO_INCREMENT PRIMARY KEY,
  category_id        INT NOT NULL,
  name               VARCHAR(120) NOT NULL,
  description        TEXT NOT NULL,                  -- embedded into Qdrant for semantic search
  unit               ENUM('sqft','sqm','piece','kg','litre','rft','bag') NOT NULL,
  durability_rating  TINYINT NOT NULL,
  maintenance_level  ENUM('LOW','MEDIUM','HIGH') NOT NULL,
  CONSTRAINT fk_materials_category FOREIGN KEY (category_id) REFERENCES material_categories(category_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_materials_durability CHECK (durability_rating BETWEEN 1 AND 5),
  CONSTRAINT uq_materials_name UNIQUE (category_id, name)
);

CREATE TABLE suppliers (
  supplier_id  INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL UNIQUE,
  email        VARCHAR(150),
  city         VARCHAR(60),
  rating       DECIMAL(2,1),
  CONSTRAINT chk_suppliers_rating CHECK (rating IS NULL OR rating BETWEEN 0 AND 5)
);

-- Many-to-many: a supplier sells many materials; a material is sold by many suppliers
CREATE TABLE supplier_materials (
  supplier_id     INT NOT NULL,
  material_id     INT NOT NULL,
  unit_price      DECIMAL(10,2) NOT NULL,
  lead_time_days  INT NOT NULL DEFAULT 7,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id, material_id),
  CONSTRAINT fk_sm_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sm_material FOREIGN KEY (material_id) REFERENCES materials(material_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_sm_price CHECK (unit_price > 0),
  CONSTRAINT chk_sm_lead  CHECK (lead_time_days >= 0)
);

-- Unit price is copied at time of use so later price changes don't rewrite past costs
CREATE TABLE material_usage (
  usage_id      INT AUTO_INCREMENT PRIMARY KEY,
  project_id    INT NOT NULL,
  supplier_id   INT NOT NULL,
  material_id   INT NOT NULL,
  recorded_by   INT NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  line_total    DECIMAL(14,2) AS (quantity * unit_price) STORED,
  area_applied  VARCHAR(100),
  used_on       DATE NOT NULL,
  CONSTRAINT fk_usage_project  FOREIGN KEY (project_id) REFERENCES projects(project_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_usage_offer    FOREIGN KEY (supplier_id, material_id)
      REFERENCES supplier_materials(supplier_id, material_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_usage_user     FOREIGN KEY (recorded_by) REFERENCES users(user_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_usage_qty   CHECK (quantity > 0),
  CONSTRAINT chk_usage_price CHECK (unit_price > 0)
);

CREATE TABLE price_history (
  history_id   INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id  INT NOT NULL,
  material_id  INT NOT NULL,
  old_price    DECIMAL(10,2) NOT NULL,
  new_price    DECIMAL(10,2) NOT NULL,
  changed_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ph_offer FOREIGN KEY (supplier_id, material_id)
      REFERENCES supplier_materials(supplier_id, material_id)
      ON UPDATE CASCADE ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. ALTER and DROP (schema evolution demo)
-- ---------------------------------------------------------------------

ALTER TABLE suppliers ADD COLUMN phone VARCHAR(15) AFTER email;
ALTER TABLE projects  ADD COLUMN area_sqft INT AFTER location;
ALTER TABLE projects  ADD CONSTRAINT chk_projects_area CHECK (area_sqft IS NULL OR area_sqft > 0);

CREATE TABLE temp_import_staging (id INT PRIMARY KEY, raw_line TEXT);
DROP TABLE temp_import_staging;

-- ---------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------

CREATE INDEX idx_projects_status        ON projects(status);
CREATE INDEX idx_usage_project_date     ON material_usage(project_id, used_on);
CREATE INDEX idx_usage_material         ON material_usage(material_id);
CREATE INDEX idx_materials_category_dur ON materials(category_id, durability_rating);
CREATE FULLTEXT INDEX ftx_materials_text ON materials(name, description);

-- ---------------------------------------------------------------------
-- 4. VIEWS
-- ---------------------------------------------------------------------

CREATE VIEW project_budget_status AS
SELECT p.project_id,
       p.name                                      AS project_name,
       c.name                                      AS client_name,
       p.status,
       p.budget,
       p.spent,
       p.budget - p.spent                          AS remaining,
       ROUND(p.spent / p.budget * 100, 1)          AS pct_used
FROM projects p
JOIN clients  c ON c.client_id = p.client_id;

CREATE VIEW material_cheapest_offer AS
SELECT m.material_id, m.name AS material_name, mc.name AS category,
       sm.supplier_id, s.name AS supplier_name, sm.unit_price, sm.lead_time_days
FROM materials m
JOIN material_categories mc ON mc.category_id = m.category_id
JOIN supplier_materials sm  ON sm.material_id = m.material_id
JOIN suppliers s            ON s.supplier_id  = sm.supplier_id
WHERE sm.unit_price = (SELECT MIN(sm2.unit_price)
                       FROM supplier_materials sm2
                       WHERE sm2.material_id = m.material_id);

-- ---------------------------------------------------------------------
-- 5. TRIGGERS
-- ---------------------------------------------------------------------

DELIMITER $$

-- Validation: block usage that would push a project over budget
CREATE TRIGGER trg_usage_budget_check
BEFORE INSERT ON material_usage
FOR EACH ROW
BEGIN
  DECLARE v_budget DECIMAL(14,2);
  DECLARE v_spent  DECIMAL(14,2);
  SELECT budget, spent INTO v_budget, v_spent
  FROM projects WHERE project_id = NEW.project_id FOR UPDATE;
  IF v_spent + (NEW.quantity * NEW.unit_price) > v_budget THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'This usage would exceed the project budget.';
  END IF;
END$$

-- Audit: log every supplier price change
CREATE TRIGGER trg_price_change_log
AFTER UPDATE ON supplier_materials
FOR EACH ROW
BEGIN
  IF NEW.unit_price <> OLD.unit_price THEN
    INSERT INTO price_history (supplier_id, material_id, old_price, new_price)
    VALUES (NEW.supplier_id, NEW.material_id, OLD.unit_price, NEW.unit_price);
  END IF;
END$$

-- ---------------------------------------------------------------------
-- 6. STORED PROCEDURES
-- ---------------------------------------------------------------------

-- Records usage as one transaction: price lookup + insert + budget update
CREATE PROCEDURE record_material_usage(
  IN p_project_id INT, IN p_supplier_id INT, IN p_material_id INT,
  IN p_user_id INT,    IN p_quantity DECIMAL(10,2),
  IN p_area VARCHAR(100), IN p_used_on DATE)
BEGIN
  DECLARE v_price DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
    SELECT unit_price INTO v_price
    FROM supplier_materials
    WHERE supplier_id = p_supplier_id AND material_id = p_material_id;

    IF v_price IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This supplier does not offer this material.';
    END IF;

    INSERT INTO material_usage
      (project_id, supplier_id, material_id, recorded_by, quantity, unit_price, area_applied, used_on)
    VALUES
      (p_project_id, p_supplier_id, p_material_id, p_user_id, p_quantity, v_price, p_area, p_used_on);

    UPDATE projects
    SET spent = spent + (p_quantity * v_price)
    WHERE project_id = p_project_id;
  COMMIT;
END$$

-- Compare all suppliers for one material, cheapest first
CREATE PROCEDURE compare_suppliers(IN p_material_id INT)
BEGIN
  SELECT s.name AS supplier, s.city, s.rating, sm.unit_price, sm.lead_time_days,
         RANK() OVER (ORDER BY sm.unit_price) AS price_rank
  FROM supplier_materials sm
  JOIN suppliers s ON s.supplier_id = sm.supplier_id
  WHERE sm.material_id = p_material_id
  ORDER BY sm.unit_price;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- 7. SAMPLE DATA (small set so every query below returns rows)
-- ---------------------------------------------------------------------

INSERT INTO users (full_name, email, password_hash, role) VALUES
 ('Admin User',   'admin@archiflow.in', '$2b$10$placeholderhashadmin000000000000000000000000000000', 'ADMIN'),
 ('Anita Rao',    'anita@archiflow.in', '$2b$10$placeholderhashanita000000000000000000000000000000', 'ARCHITECT'),
 ('Vikram Menon', 'vikram@archiflow.in','$2b$10$placeholderhashvikram00000000000000000000000000000', 'ARCHITECT');

INSERT INTO clients (name, email, phone, city) VALUES
 ('Greenleaf Hotels',  'projects@greenleaf.in', '9845012345', 'Bengaluru'),
 ('Nair Residence',    'anil.nair@mail.com',    '9447098765', 'Kochi'),
 ('Brightpath School', 'admin@brightpath.edu',  '8023456789', 'Mysuru');

INSERT INTO projects (client_id, lead_architect_id, name, description, project_type, location, area_sqft, status, budget, start_date, end_date) VALUES
 (1, 2, 'Greenleaf Lobby Revamp',  'Renovation of a busy hotel lobby needing durable, premium flooring and acoustic ceilings.', 'HOSPITALITY',  'Bengaluru', 4200, 'IN_PROGRESS', 2500000, '2026-07-01', '2026-12-15'),
 (2, 3, 'Nair Villa',              'Two-storey family villa in a humid coastal climate with low-maintenance finishes.',       'RESIDENTIAL',  'Kochi',     3100, 'IN_PROGRESS', 1800000, '2026-05-10', NULL),
 (3, 2, 'Brightpath Classroom Wing','New classroom block with high-traffic corridors and easy-to-clean surfaces.',              'INSTITUTIONAL','Mysuru',    9000, 'PLANNING',    3200000, '2026-11-01', NULL);

INSERT INTO material_categories (name) VALUES ('Flooring'), ('Wall finish'), ('Ceiling'), ('Paint');

INSERT INTO materials (category_id, name, description, unit, durability_rating, maintenance_level) VALUES
 (1, 'Vitrified tile 600x600', 'Glazed vitrified tile, scratch and stain resistant, suited to high-traffic indoor areas.', 'sqft', 5, 'LOW'),
 (1, 'Italian marble',         'Premium natural marble with elegant veining; needs periodic polishing and sealing.',     'sqft', 4, 'HIGH'),
 (1, 'Vinyl plank',            'Affordable water-resistant vinyl planks with a wood look, quick to install.',            'sqft', 3, 'LOW'),
 (2, 'Wall cladding stone',    'Natural stone cladding for feature walls, weather resistant for exteriors.',             'sqft', 5, 'LOW'),
 (3, 'Acoustic gypsum board',  'Perforated gypsum ceiling board that reduces echo in large rooms.',                      'sqft', 4, 'LOW'),
 (4, 'Anti-fungal exterior paint','Weatherproof emulsion with anti-fungal additives for humid climates.',                'litre',4, 'LOW');

INSERT INTO suppliers (name, email, phone, city, rating) VALUES
 ('StoneCraft Traders', 'sales@stonecraft.in', '9880011223', 'Bengaluru', 4.5),
 ('Kerala Build Mart',  'info@kbm.in',         '9446677889', 'Kochi',     4.1),
 ('Urban Interiors Co', 'hello@urbanint.in',   '9900112233', 'Bengaluru', 3.8);

INSERT INTO supplier_materials (supplier_id, material_id, unit_price, lead_time_days) VALUES
 (1,1,  85, 5), (2,1,  78, 7), (3,1,  92, 3),
 (1,2, 450,14),
 (2,3,  65, 4), (3,3,  60, 6),
 (1,4, 210,10),
 (3,5, 120, 5),
 (2,6, 380, 2);

-- Usage recorded through the transactional procedure
CALL record_material_usage(1, 1, 2, 2,  1500, 'Main lobby floor',     '2026-08-02');
CALL record_material_usage(1, 3, 5, 2,  2000, 'Lobby ceiling',        '2026-08-20');
CALL record_material_usage(2, 2, 1, 3,  1200, 'Ground floor living',  '2026-06-15');
CALL record_material_usage(2, 2, 6, 3,   150, 'Exterior walls',       '2026-07-05');
CALL record_material_usage(2, 1, 4, 3,   300, 'Front elevation',      '2026-07-25');
CALL record_material_usage(1, 2, 1, 2,   800, 'Service corridors',    '2026-09-05');

-- Fires trg_price_change_log
UPDATE supplier_materials SET unit_price = 82 WHERE supplier_id = 2 AND material_id = 1;


-- =====================================================================
-- 8. SAMPLE QUERIES
-- =====================================================================

-- Q1. JOIN: every usage line with project, material, supplier and who recorded it
SELECT p.name AS project, m.name AS material, s.name AS supplier,
       mu.quantity, mu.unit_price, mu.line_total, u.full_name AS recorded_by
FROM material_usage mu
JOIN projects  p ON p.project_id  = mu.project_id
JOIN materials m ON m.material_id = mu.material_id
JOIN suppliers s ON s.supplier_id = mu.supplier_id
JOIN users     u ON u.user_id     = mu.recorded_by
ORDER BY mu.used_on DESC;

-- Q2. GROUP BY + aggregate: spend per project per material category
SELECT p.name AS project, mc.name AS category, SUM(mu.line_total) AS category_spend
FROM material_usage mu
JOIN projects p              ON p.project_id   = mu.project_id
JOIN materials m             ON m.material_id  = mu.material_id
JOIN material_categories mc  ON mc.category_id = m.category_id
GROUP BY p.project_id, p.name, mc.name
ORDER BY p.name, category_spend DESC;

-- Q3. HAVING: materials used in more than one project (reused, proven choices)
SELECT m.name AS material, COUNT(DISTINCT mu.project_id) AS projects_used_in,
       SUM(mu.quantity) AS total_qty
FROM material_usage mu
JOIN materials m ON m.material_id = mu.material_id
GROUP BY m.material_id, m.name
HAVING COUNT(DISTINCT mu.project_id) > 1;

-- Q4. Subquery: suppliers whose price for a material is above that material's average price
SELECT s.name AS supplier, m.name AS material, sm.unit_price
FROM supplier_materials sm
JOIN suppliers s ON s.supplier_id = sm.supplier_id
JOIN materials m ON m.material_id = sm.material_id
WHERE sm.unit_price > (SELECT AVG(sm2.unit_price)
                       FROM supplier_materials sm2
                       WHERE sm2.material_id = sm.material_id);

-- Q5. Subquery with NOT EXISTS: materials never used in any project
SELECT m.name, mc.name AS category
FROM materials m
JOIN material_categories mc ON mc.category_id = m.category_id
WHERE NOT EXISTS (SELECT 1 FROM material_usage mu WHERE mu.material_id = m.material_id);

-- Q6. View: projects that have used more than 30% of their budget
SELECT * FROM project_budget_status
WHERE pct_used > 30
ORDER BY pct_used DESC;

-- Q7. Rule-based recommendation: durable, low-maintenance flooring under a price cap,
--     ranked by how often it was used before, then by cheapest offer
SELECT m.name, m.durability_rating, mco.supplier_name, mco.unit_price,
       (SELECT COUNT(*) FROM material_usage mu WHERE mu.material_id = m.material_id) AS times_used
FROM materials m
JOIN material_cheapest_offer mco ON mco.material_id = m.material_id
WHERE mco.category = 'Flooring'
  AND m.durability_rating >= 4
  AND m.maintenance_level = 'LOW'
  AND mco.unit_price <= 100
ORDER BY times_used DESC, mco.unit_price;

-- Q8. Full-text search (keyword baseline to compare with semantic search)
SELECT name, MATCH(name, description) AGAINST ('high-traffic durable' IN NATURAL LANGUAGE MODE) AS score
FROM materials
WHERE MATCH(name, description) AGAINST ('high-traffic durable' IN NATURAL LANGUAGE MODE)
ORDER BY score DESC;

-- Q9. Price history audit (filled by trigger)
SELECT s.name AS supplier, m.name AS material, ph.old_price, ph.new_price,
       ROUND((ph.new_price - ph.old_price) / ph.old_price * 100, 1) AS pct_change, ph.changed_at
FROM price_history ph
JOIN suppliers s ON s.supplier_id = ph.supplier_id
JOIN materials m ON m.material_id = ph.material_id
ORDER BY ph.changed_at DESC;

-- Q10. Stored procedure: compare suppliers for vitrified tile
CALL compare_suppliers(1);

-- Q11. UPDATE and DELETE examples
UPDATE projects SET status = 'COMPLETED', end_date = '2026-10-10' WHERE project_id = 2;
DELETE FROM supplier_materials WHERE supplier_id = 3 AND material_id = 3;   -- discontinued offer

-- Q12. Transaction + trigger rejection demo: this fails with the budget message,
--      and the procedure rolls back so nothing is saved
-- CALL record_material_usage(2, 1, 2, 3, 10000, 'Over-budget test', '2026-10-01');

-- Q13. EXPLAIN: show the index being used
EXPLAIN SELECT * FROM material_usage WHERE project_id = 1 AND used_on >= '2026-08-01';
