-- ============================================================
-- FILE: 04_views.sql
-- RUN AS: hiring_app
-- PURPOSE: Saved views used by backend and frontend
-- ============================================================

-- ------------------------------------------------------------
-- VIEW 1: Full Application Pipeline
-- PURPOSE: Complete view of every application with candidate,
--          job, company and attached resume info
-- USED BY: Backend /api/applications endpoint
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
    R.file_url                           AS resume_file,
    R.version_label                      AS resume_version,
    A.applied_date,
    A.status                             AS application_status,
    A.days_in_pipeline
FROM
    APPLICATION  A
    JOIN CANDIDATE   C   ON A.candidate_id = C.candidate_id
    JOIN JOB_POSTING J   ON A.job_id       = J.job_id
    JOIN COMPANY     CO  ON J.company_id   = CO.company_id
    LEFT JOIN RESUME R   ON A.resume_id    = R.resume_id;


-- ------------------------------------------------------------
-- VIEW 2: Open Jobs with Company Info
-- PURPOSE: All currently open positions with company details
-- USED BY: Backend /api/jobs endpoint
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
    CO.name        AS company_name,
    CO.location    AS company_location,
    CO.industry
FROM
    JOB_POSTING J
    JOIN COMPANY CO ON J.company_id = CO.company_id
WHERE
    J.status = 'Open';


-- ============================================================
-- TEST:
-- SELECT * FROM VW_APPLICATION_PIPELINE;
-- SELECT * FROM VW_OPEN_JOBS;
-- ============================================================