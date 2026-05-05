-- ============================================================
-- FILE: 03_queries.sql
-- RUN AS: hiring_app
-- PURPOSE: Required data fetching queries for deliverable
-- WHAT'S HERE: 2 JOINs, 2 Subqueries
-- ============================================================


-- ------------------------------------------------------------
-- JOIN 1: Candidate + Application + Job Posting
-- PURPOSE: See who applied to which job
-- HOW IT WORKS: We link 3 tables using their foreign keys.
--   CANDIDATE.candidate_id = APPLICATION.candidate_id
--   APPLICATION.job_id     = JOB_POSTING.job_id
-- ------------------------------------------------------------
SELECT
    C.first_name || ' ' || C.last_name   AS candidate_name,
    C.email,
    J.title                              AS job_title,
    J.department,
    A.applied_date,
    A.status                             AS application_status
FROM
    CANDIDATE C
    JOIN APPLICATION A   ON C.candidate_id = A.candidate_id
    JOIN JOB_POSTING J   ON A.job_id       = J.job_id
ORDER BY
    A.applied_date DESC;


-- ------------------------------------------------------------
-- JOIN 2: Interview + Interviewer + Company + Application + Candidate
-- PURPOSE: Full interview report — who interviewed whom, at which company
-- HOW IT WORKS: We follow the chain:
--   INTERVIEW links to APPLICATION (to know the candidate)
--   INTERVIEW links to INTERVIEWER (to know who conducted it)
--   INTERVIEWER links to COMPANY
-- ------------------------------------------------------------
SELECT
    C.first_name || ' ' || C.last_name   AS candidate_name,
    I.interview_type,
    IV.name                              AS interviewer_name,
    IV.job_title                         AS interviewer_title,
    CO.name                              AS company_name
FROM
    INTERVIEW I
    JOIN APPLICATION A      ON I.application_id  = A.application_id
    JOIN CANDIDATE C        ON A.candidate_id    = C.candidate_id
    JOIN INTERVIEWER IV     ON I.interviewer_id  = IV.interviewer_id
    JOIN COMPANY CO         ON I.company_id      = CO.company_id;


-- ------------------------------------------------------------
-- SUBQUERY 1: Candidates who have at least one application
-- PURPOSE: Filter — only show candidates who actually applied
-- HOW IT WORKS: The inner query (SELECT candidate_id FROM APPLICATION)
--   returns a list of IDs. The outer query checks if each candidate
--   is IN that list.
-- ------------------------------------------------------------
SELECT
    candidate_id,
    first_name || ' ' || last_name  AS full_name,
    email,
    skills
FROM
    CANDIDATE
WHERE
    candidate_id IN (
        SELECT candidate_id FROM APPLICATION
    );


-- ------------------------------------------------------------
-- SUBQUERY 2: Jobs that have received at least one application
-- PURPOSE: Filter active jobs only (no ghost postings)
-- HOW IT WORKS: Inner query finds all job_ids that appear in
--   APPLICATION table. Outer query shows only those jobs.
-- ------------------------------------------------------------
SELECT
    job_id,
    title,
    department,
    emp_type,
    status,
    salary_range
FROM
    JOB_POSTING
WHERE
    job_id IN (
        SELECT job_id FROM APPLICATION
    );