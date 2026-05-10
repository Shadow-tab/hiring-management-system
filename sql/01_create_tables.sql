-- ============================================================
-- FILE: 01_create_tables.sql
-- RUN AS: hiring_app
-- PURPOSE: Create all tables exactly as per EERD
-- ORDER MATTERS: Parent tables first, child tables after
-- ============================================================

-- ------------------------------------------------------------
-- TABLE 1: COMPANY
-- Parent table — no foreign keys
-- ------------------------------------------------------------
CREATE TABLE COMPANY (
    company_id      NUMBER          PRIMARY KEY,
    name            VARCHAR2(100)   NOT NULL,
    location        VARCHAR2(100),
    website         VARCHAR2(200),
    industry        VARCHAR2(100)
);

-- ------------------------------------------------------------
-- TABLE 2: INTERVIEWER
-- Belongs to a COMPANY via 'employs' relationship
-- ------------------------------------------------------------
CREATE TABLE INTERVIEWER (
    interviewer_id  NUMBER          PRIMARY KEY,
    name            VARCHAR2(100)   NOT NULL,
    email           VARCHAR2(100)   UNIQUE NOT NULL,
    department      VARCHAR2(100),
    job_title       VARCHAR2(100),
    company_id      NUMBER          NOT NULL,
    CONSTRAINT fk_interviewer_company
        FOREIGN KEY (company_id) REFERENCES COMPANY(company_id)
);

-- ------------------------------------------------------------
-- TABLE 3: JOB_POSTING
-- Posted by a COMPANY via 'Posts' relationship (1:N)
-- ------------------------------------------------------------
CREATE TABLE JOB_POSTING (
    job_id          NUMBER          PRIMARY KEY,
    title           VARCHAR2(100)   NOT NULL,
    department      VARCHAR2(100),
    emp_type        VARCHAR2(50),
    posted_date     DATE,
    closing_date    DATE,
    status          VARCHAR2(50),
    description     VARCHAR2(1000),
    salary_range    VARCHAR2(50),
    required_skills VARCHAR2(500),
    company_id      NUMBER          NOT NULL,
    CONSTRAINT fk_job_company
        FOREIGN KEY (company_id) REFERENCES COMPANY(company_id)
);

-- ------------------------------------------------------------
-- TABLE 4: CANDIDATE
-- Parent of APPLICATION and RESUME
-- ------------------------------------------------------------
CREATE TABLE CANDIDATE (
    candidate_id    NUMBER          PRIMARY KEY,
    first_name      VARCHAR2(50)    NOT NULL,
    last_name       VARCHAR2(50)    NOT NULL,
    email           VARCHAR2(100)   UNIQUE NOT NULL,
    phone           VARCHAR2(20),
    location        VARCHAR2(100),
    reg_date        DATE,
    skills          VARCHAR2(500)
);

-- ------------------------------------------------------------
-- TABLE 5: RESUME
-- Owned by CANDIDATE via 'owns' relationship (1:N)
-- Attributes: resume_id, file_url, summary, version_label, upload_date
-- ------------------------------------------------------------
CREATE TABLE RESUME (
    resume_id       NUMBER          PRIMARY KEY,
    file_url        VARCHAR2(300),
    summary         VARCHAR2(1000),
    version_label   VARCHAR2(50),
    upload_date     DATE,
    candidate_id    NUMBER          NOT NULL,
    CONSTRAINT fk_resume_candidate
        FOREIGN KEY (candidate_id) REFERENCES CANDIDATE(candidate_id)
);

-- ------------------------------------------------------------
-- TABLE 6: APPLICATION
-- CANDIDATE submits APPLICATION (1:N)
-- JOB_POSTING receives APPLICATION (1:N)
-- APPLICATION attaches RESUME (N:1) — from EERD 'attaches' relationship
-- ------------------------------------------------------------
CREATE TABLE APPLICATION (
    application_id      NUMBER          PRIMARY KEY,
    applied_date        DATE,
    cover_letter        VARCHAR2(2000),
    days_in_pipeline    NUMBER,
    status              VARCHAR2(50),
    candidate_id        NUMBER          NOT NULL,
    job_id              NUMBER          NOT NULL,
    resume_id           NUMBER,
    CONSTRAINT fk_app_candidate
        FOREIGN KEY (candidate_id) REFERENCES CANDIDATE(candidate_id),
    CONSTRAINT fk_app_job
        FOREIGN KEY (job_id) REFERENCES JOB_POSTING(job_id),
    CONSTRAINT fk_app_resume
        FOREIGN KEY (resume_id) REFERENCES RESUME(resume_id)
);

-- ------------------------------------------------------------
-- TABLE 7: INTERVIEW (supertype)
-- INTERVIEWER conducts INTERVIEW (1:N)
-- APPLICATION has INTERVIEW (N:N handled via FK)
-- 'd' triangle = disjoint specialization
--   every interview must be exactly ONE of the three subtypes
-- Only own attributes: interview_id, interview_type
-- company_id shown in EERD is from the conducts/employs chain
-- ------------------------------------------------------------
CREATE TABLE INTERVIEW (
    interview_id    NUMBER          PRIMARY KEY,
    interview_type  VARCHAR2(50)    NOT NULL,
    application_id  NUMBER          NOT NULL,
    interviewer_id  NUMBER          NOT NULL,
    CONSTRAINT fk_interview_app
        FOREIGN KEY (application_id) REFERENCES APPLICATION(application_id),
    CONSTRAINT fk_interview_interviewer
        FOREIGN KEY (interviewer_id) REFERENCES INTERVIEWER(interviewer_id),
    CONSTRAINT chk_interview_type
        CHECK (interview_type IN ('PHONE', 'TECH', 'PANEL'))
);

-- ------------------------------------------------------------
-- TABLE 8: PHONE_SCREEN (subtype of INTERVIEW)
-- Own attribute per EERD: duration_mins only
-- ------------------------------------------------------------
CREATE TABLE PHONE_SCREEN (
    interview_id    NUMBER          PRIMARY KEY,
    duration_mins   NUMBER,
    CONSTRAINT fk_phone_interview
        FOREIGN KEY (interview_id) REFERENCES INTERVIEW(interview_id)
);

-- ------------------------------------------------------------
-- TABLE 9: TECH_INTERVIEW (subtype of INTERVIEW)
-- Own attribute per EERD: platform only
-- ------------------------------------------------------------
CREATE TABLE TECH_INTERVIEW (
    interview_id    NUMBER          PRIMARY KEY,
    platform        VARCHAR2(100),
    CONSTRAINT fk_tech_interview
        FOREIGN KEY (interview_id) REFERENCES INTERVIEW(interview_id)
);

-- ------------------------------------------------------------
-- TABLE 10: PANEL_INTERVIEW (subtype of INTERVIEW)
-- Own attribute per EERD: panel_size only
-- ------------------------------------------------------------
CREATE TABLE PANEL_INTERVIEW (
    interview_id    NUMBER          PRIMARY KEY,
    panel_size      NUMBER,
    CONSTRAINT fk_panel_interview
        FOREIGN KEY (interview_id) REFERENCES INTERVIEW(interview_id)
);

-- ------------------------------------------------------------
-- TABLE 11: OFFER
-- APPLICATION generates OFFER (0..1 on OFFER side)
-- UNIQUE on application_id enforces the 0..1 cardinality
-- ------------------------------------------------------------
CREATE TABLE OFFER (
    offer_id            NUMBER          PRIMARY KEY,
    offer_date          DATE,
    base_salary         NUMBER(10,2),
    benefits_summary    VARCHAR2(500),
    start_date          DATE,
    status              VARCHAR2(50),
    application_id      NUMBER          UNIQUE NOT NULL,
    CONSTRAINT fk_offer_app
        FOREIGN KEY (application_id) REFERENCES APPLICATION(application_id)
);

-- ------------------------------------------------------------
-- TABLE 12: HIRING_DECISION
-- OFFER informs HIRING_DECISION (1:N)
-- APPLICATION results_in HIRING_DECISION (1:N)
-- ------------------------------------------------------------
CREATE TABLE HIRING_DECISION (
    decision_id     NUMBER          PRIMARY KEY,
    decision_date   DATE,
    outcome         VARCHAR2(50),
    rationale       VARCHAR2(1000),
    status          VARCHAR2(50),
    application_id  NUMBER          NOT NULL,
    offer_id        NUMBER          NOT NULL,
    CONSTRAINT fk_decision_app
        FOREIGN KEY (application_id) REFERENCES APPLICATION(application_id),
    CONSTRAINT fk_decision_offer
        FOREIGN KEY (offer_id) REFERENCES OFFER(offer_id)
);

-- ------------------------------------------------------------
-- TABLE 13: USERS
-- Auth table — links each login to its entity row
-- role IN ('ADMIN','COMPANY','INTERVIEWER','CANDIDATE')
-- entity_id references the matching row in CANDIDATE / COMPANY / INTERVIEWER
-- ------------------------------------------------------------
CREATE TABLE USERS (
    user_id     NUMBER          PRIMARY KEY,
    name        VARCHAR2(100)   NOT NULL,
    email       VARCHAR2(100)   UNIQUE NOT NULL,
    password    VARCHAR2(200)   NOT NULL,
    role        VARCHAR2(20)    NOT NULL,
    entity_id   NUMBER,
    created_at  DATE,
    CONSTRAINT chk_users_role
        CHECK (role IN ('ADMIN','COMPANY','INTERVIEWER','CANDIDATE'))
);

-- ============================================================
-- VERIFY: SELECT table_name FROM user_tables ORDER BY table_name;
-- ============================================================