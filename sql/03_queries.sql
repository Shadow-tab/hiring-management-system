-- ============================================================
-- FILE: 03_queries.sql
-- RUN AS: hiring_app
-- PURPOSE: Required data fetching queries
-- CONTAINS: 2 JOINs + 2 Subqueries
-- ============================================================

-- ------------------------------------------------------------
-- JOIN 1: Candidate + Application + Job Posting + Company
-- PURPOSE: Full application report — who applied where
-- ------------------------------------------------------------
SELECT
    C.first_name || ' ' || C.last_name   AS candidate_name,
    C.email,
    J.title                              AS job_title,
    J.department,
    CO.name                              AS company_name,
    A.applied_date,
    A.status                             AS application_status
FROM
    CANDIDATE    C
    JOIN APPLICATION  A  ON C.candidate_id = A.candidate_id
    JOIN JOB_POSTING  J  ON A.job_id       = J.job_id
    JOIN COMPANY      CO ON J.company_id   = CO.company_id
ORDER BY
    A.applied_date DESC;


-- ------------------------------------------------------------
-- JOIN 2: Interview full report
-- PURPOSE: Who was interviewed, by whom, for which application
-- Follows: APPLICATION -> INTERVIEW -> INTERVIEWER -> CANDIDATE
-- ------------------------------------------------------------
SELECT
    C.first_name || ' ' || C.last_name   AS candidate_name,
    IV.name                              AS interviewer_name,
    IV.job_title                         AS interviewer_title,
    I.interview_type,
    J.title                              AS job_title,
    A.status                             AS application_status
FROM
    INTERVIEW    I
    JOIN APPLICATION  A   ON I.application_id  = A.application_id
    JOIN CANDIDATE    C   ON A.candidate_id    = C.candidate_id
    JOIN INTERVIEWER  IV  ON I.interviewer_id  = IV.interviewer_id
    JOIN JOB_POSTING  J   ON A.job_id          = J.job_id;


-- ------------------------------------------------------------
-- SUBQUERY 1: Candidates who have submitted at least one application
-- PURPOSE: Filter only active candidates in the system
-- HOW: Inner query returns list of candidate_ids from APPLICATION
--      Outer query keeps only candidates IN that list
-- ------------------------------------------------------------
SELECT
    candidate_id,
    first_name || ' ' || last_name   AS full_name,
    email,
    skills
FROM
    CANDIDATE
WHERE
    candidate_id IN (
        SELECT candidate_id FROM APPLICATION
    );


-- ------------------------------------------------------------
-- SUBQUERY 2: Job postings that have received applications
-- PURPOSE: Show only jobs with real candidate interest
-- HOW: Inner query returns job_ids that appear in APPLICATION
--      Outer query keeps only those jobs
-- ------------------------------------------------------------
SELECT
    J.job_id,
    J.title,
    J.department,
    J.emp_type,
    J.salary_range,
    J.status
FROM
    JOB_POSTING J
WHERE
    J.job_id IN (
        SELECT job_id FROM APPLICATION
    );