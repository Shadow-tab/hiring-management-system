-- ============================================================
-- FILE: 04_views.sql
-- RUN AS: hiring_app
-- PURPOSE: Create saved/reusable views for the application
-- WHAT IS A VIEW: Think of it as a saved SELECT query with a name.
--   You query it exactly like a table: SELECT * FROM view_name;
--   It doesn't store data — it runs the query fresh each time.
-- ============================================================


-- ------------------------------------------------------------
-- VIEW 1: Full Application Pipeline
-- PURPOSE: Single view that shows every application with all
--   related info — candidate, job, company in one place.
--   The frontend and backend will use this view heavily.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW VW_APPLICATION_PIPELINE AS
SELECT
    A.application_id,
    C.first_name || ' ' || C.last_name   AS candidate_name,
    C.email                              AS candidate_email,
    C.location                           AS candidate_location,
    J.title                              AS job_title,
    J.department,
    J.emp_type,
    J.salary_range,
    CO.name                              AS company_name,
    A.applied_date,
    A.status                             AS application_status,
    A.days_in_pipeline
FROM
    APPLICATION A
    JOIN CANDIDATE  C   ON A.candidate_id = C.candidate_id
    JOIN JOB_POSTING J  ON A.job_id       = J.job_id
    JOIN COMPANY    CO  ON J.company_id   = CO.company_id;


-- ------------------------------------------------------------
-- VIEW 2: Open Jobs with Company Info
-- PURPOSE: Show all currently open job postings with their
--   company details. Used for the job listings page.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW VW_OPEN_JOBS AS
SELECT
    J.job_id,
    J.title,
    J.department,
    J.emp_type,
    J.salary_range,
    J.required_skills,
    J.posted_date,
    J.closing_date,
    CO.name         AS company_name,
    CO.location     AS company_location,
    CO.industry
FROM
    JOB_POSTING J
    JOIN COMPANY CO ON J.company_id = CO.company_id
WHERE
    J.status = 'Open';


-- ============================================================
-- TEST YOUR VIEWS — run these after creating them:
-- ============================================================
-- SELECT * FROM VW_APPLICATION_PIPELINE;
-- SELECT * FROM VW_OPEN_JOBS;