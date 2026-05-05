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
-- Belongs to a COMPANY
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
-- Posted by a COMPANY
-- ------------------------------------------------------------
CREATE TABLE JOB_POSTING (
    job_id              NUMBER          PRIMARY KEY,
    title               VARCHAR2(100)   NOT NULL,
    department          VARCHAR2(100),
    emp_type            VARCHAR2(50),       -- e.g. Full-Time, Part-Time, Contract
    posted_date         DATE,
    closing_date        DATE,
    status              VARCHAR2(50),       -- e.g. Open, Closed, On Hold
    description         VARCHAR2(1000),
    salary_range        VARCHAR2(50),       -- e.g. '60000-80000'
    required_skills     VARCHAR2(500),
    company_id          NUMBER          NOT NULL,
    CONSTRAINT fk_job_company
        FOREIGN KEY (company_id) REFERENCES COMPANY(company_id)
);

-- ------------------------------------------------------------
-- TABLE 4: CANDIDATE
-- Standalone — parent of APPLICATION and RESUME
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
-- Belongs to a CANDIDATE (1 candidate can have many resumes)
-- ------------------------------------------------------------
CREATE TABLE RESUME (
    resume_id       NUMBER          PRIMARY KEY,
    file_url        VARCHAR2(300),
    summary         VARCHAR2(1000),
    version_label   VARCHAR2(50),       -- e.g. 'v1', 'v2', 'Final'
    upload_date     DATE,
    candidate_id    NUMBER          NOT NULL,
    CONSTRAINT fk_resume_candidate
        FOREIGN KEY (candidate_id) REFERENCES CANDIDATE(candidate_id)
);

-- ------------------------------------------------------------
-- TABLE 6: APPLICATION
-- A CANDIDATE applies to a JOB_POSTING
-- Bridge between CANDIDATE and JOB_POSTING
-- ------------------------------------------------------------
CREATE TABLE APPLICATION (
    application_id      NUMBER          PRIMARY KEY,
    applied_date        DATE,
    cover_letter        VARCHAR2(2000),
    days_in_pipeline    NUMBER,
    status              VARCHAR2(50),       -- e.g. Applied, Screening, Interview, Rejected, Offered
    candidate_id        NUMBER          NOT NULL,
    job_id              NUMBER          NOT NULL,
    CONSTRAINT fk_app_candidate
        FOREIGN KEY (candidate_id) REFERENCES CANDIDATE(candidate_id),
    CONSTRAINT fk_app_job
        FOREIGN KEY (job_id) REFERENCES JOB_POSTING(job_id)
);

-- ------------------------------------------------------------
-- TABLE 7: INTERVIEW (base/parent for subtypes)
-- Linked to APPLICATION and INTERVIEWER
-- company_id is carried here as per EERD
-- ------------------------------------------------------------
CREATE TABLE INTERVIEW (
    interview_id    NUMBER          PRIMARY KEY,
    application_id  NUMBER          NOT NULL,
    interviewer_id  NUMBER          NOT NULL,
    company_id      NUMBER          NOT NULL,
    interview_type  VARCHAR2(50),       -- 'PHONE', 'TECH', 'PANEL'
    CONSTRAINT fk_interview_app
        FOREIGN KEY (application_id) REFERENCES APPLICATION(application_id),
    CONSTRAINT fk_interview_interviewer
        FOREIGN KEY (interviewer_id) REFERENCES INTERVIEWER(interviewer_id),
    CONSTRAINT fk_interview_company
        FOREIGN KEY (company_id) REFERENCES COMPANY(company_id)
);

-- ------------------------------------------------------------
-- TABLE 8: PHONE_SCREEN (subtype of INTERVIEW)
-- Extra attributes specific to phone screens
-- ------------------------------------------------------------
CREATE TABLE PHONE_SCREEN (
    interview_id    NUMBER          PRIMARY KEY,
    duration_mins   NUMBER,
    platform        VARCHAR2(100),      -- e.g. Zoom, Google Meet, Phone
    CONSTRAINT fk_phone_interview
        FOREIGN KEY (interview_id) REFERENCES INTERVIEW(interview_id)
);

-- ------------------------------------------------------------
-- TABLE 9: TECH_INTERVIEW (subtype of INTERVIEW)
-- ------------------------------------------------------------
CREATE TABLE TECH_INTERVIEW (
    interview_id    NUMBER          PRIMARY KEY,
    duration_mins   NUMBER,
    platform        VARCHAR2(100),      -- e.g. HackerRank, CoderPad
    CONSTRAINT fk_tech_interview
        FOREIGN KEY (interview_id) REFERENCES INTERVIEW(interview_id)
);

-- ------------------------------------------------------------
-- TABLE 10: PANEL_INTERVIEW (subtype of INTERVIEW)
-- ------------------------------------------------------------
CREATE TABLE PANEL_INTERVIEW (
    interview_id    NUMBER          PRIMARY KEY,
    duration_mins   NUMBER,
    panel_size      NUMBER,             -- how many interviewers in the panel
    CONSTRAINT fk_panel_interview
        FOREIGN KEY (interview_id) REFERENCES INTERVIEW(interview_id)
);

-- ------------------------------------------------------------
-- TABLE 11: OFFER
-- Made for an APPLICATION (1 application can get 0 or 1 offer)
-- ------------------------------------------------------------
CREATE TABLE OFFER (
    offer_id        NUMBER          PRIMARY KEY,
    offer_date      DATE,
    base_salary     NUMBER(10,2),
    benefits_summary VARCHAR2(500),
    start_date      DATE,
    status          VARCHAR2(50),       -- e.g. Pending, Accepted, Rejected
    application_id  NUMBER          UNIQUE NOT NULL,    -- UNIQUE enforces 0..1
    CONSTRAINT fk_offer_app
        FOREIGN KEY (application_id) REFERENCES APPLICATION(application_id)
);

-- ------------------------------------------------------------
-- TABLE 12: HIRING_DECISION
-- Informed by OFFER, linked to APPLICATION
-- ------------------------------------------------------------
CREATE TABLE HIRING_DECISION (
    decision_id     NUMBER          PRIMARY KEY,
    decision_date   DATE,
    outcome         VARCHAR2(50),       -- e.g. Hired, Rejected, Waitlisted
    rationale       VARCHAR2(1000),
    status          VARCHAR2(50),
    application_id  NUMBER          NOT NULL,
    offer_id        NUMBER,             -- nullable: decision can exist without offer
    CONSTRAINT fk_decision_app
        FOREIGN KEY (application_id) REFERENCES APPLICATION(application_id),
    CONSTRAINT fk_decision_offer
        FOREIGN KEY (offer_id) REFERENCES OFFER(offer_id)
);

-- ============================================================
-- VERIFICATION: Run this after to confirm all tables created
-- ============================================================
-- SELECT table_name FROM user_tables ORDER BY table_name;